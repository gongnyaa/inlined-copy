import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SectionExtractor } from './sectionExtractor';
import { FileResolver } from './fileResolver/fileResolver';
import { 
  LargeDataException, 
  DuplicateReferenceException, 
  CircularReferenceException,
  RecursionDepthException,
  errorToFileResult 
} from './errors/errorTypes';
import { VSCodeEnvironment } from './utils/vscodeEnvironment';

/**
 * Expands file references in the format ![[filename]] or ![[filename#heading]] with the content of the referenced file
 */
export class FileExpander {
  /**
   * Expands file references in the given text
   * @param text The text containing file references
   * @param basePath The base path to resolve relative file paths
   * @param visitedPaths Optional array of file paths that have been visited (for circular reference detection)
   * @param currentDepth Current recursion depth (default: 0)
   * @returns The expanded text with file references replaced by their content
   */
  public static async expandFileReferences(text: string, basePath: string, visitedPaths: string[] = [], currentDepth = 0): Promise<string> {
    console.log(`Expanding file references at depth ${currentDepth}`);
    // Get maximum recursion depth from configuration
    const MAX_RECURSION_DEPTH = VSCodeEnvironment.getConfiguration('inlined-copy', 'maxRecursionDepth', 1);
    
    // Check if recursion depth exceeds limit
    if (currentDepth > MAX_RECURSION_DEPTH) {
      console.log(`Recursion depth ${currentDepth} exceeds maximum ${MAX_RECURSION_DEPTH}, throwing exception.`);
      throw new RecursionDepthException(`Maximum recursion depth (${MAX_RECURSION_DEPTH}) exceeded`);
    }
    
    // Regular expression to match ![[filename]] or ![[filename#heading]] patterns
    const fileReferenceRegex = /!\[\[(.*?)(?:#(.*?))?\]\]/g;
    
    let result = text;
    let match;
    
    // Track processed files to detect duplicates
    const processedFiles = new Set<string>();
    
    // Find all file references in the text
    while ((match = fileReferenceRegex.exec(text)) !== null) {
      const fullMatch = match[0]; // The entire ![[filename]] or ![[filename#heading]] match
      const filePath = match[1].trim(); // The filename part
      const heading = match[2] ? match[2].trim() : null; // The heading part if present
      
      try {
        // Resolve the file path (handle both absolute and relative paths)
        const resolvedPath = await this.resolveFilePath(filePath, basePath);
        
        // Check for circular references
        if (visitedPaths.includes(resolvedPath)) {
          const pathChain = [...visitedPaths, resolvedPath].map(p => path.basename(p)).join(' → ');
          throw new CircularReferenceException(`Circular reference detected: ${pathChain}`);
        }
        
        // Check for duplicate references
        if (processedFiles.has(resolvedPath)) {
          const relativePath = path.relative(basePath, resolvedPath);
          const warning = new DuplicateReferenceException(`Duplicate reference detected: ${relativePath}`);
          VSCodeEnvironment.showWarningMessage(warning.message);
          // Keep the original reference for duplicates
          continue;
        }
        
        // Add to processed files
        processedFiles.add(resolvedPath);
        
        // Read the file content
        const fileContent = await this.readFileContent(resolvedPath);
        
        // Extract section if heading is specified
        let contentToInsert = fileContent;
        if (heading) {
          const sectionContent = SectionExtractor.extractSection(fileContent, heading);
          if (sectionContent) {
            contentToInsert = sectionContent;
          } else {
            VSCodeEnvironment.showWarningMessage(`Heading "${heading}" not found in file "${filePath}"`);
          }
        }
        
        // Recursively expand references in the inserted content
        // Create a new array of visited paths to avoid modifying the original
        const newVisitedPaths = [...visitedPaths, resolvedPath];
        contentToInsert = await this.expandFileReferences(
          contentToInsert, 
          path.dirname(resolvedPath), 
          newVisitedPaths,
          currentDepth + 1
        );
        
        // Parameters will be processed after all file references are expanded
        
        // Replace the file reference with the file content
        result = result.replace(fullMatch, contentToInsert);
      } catch (error) {
        // If file not found or other error, leave the reference as is and log error
        console.error(`Error expanding file reference ${fullMatch}: ${error}`);
        
        // Show appropriate message based on error type
        if (error instanceof LargeDataException) {
          VSCodeEnvironment.showWarningMessage(`Large file detected: ${error.message}`);
        } else if (error instanceof DuplicateReferenceException) {
          VSCodeEnvironment.showWarningMessage(error.message);
        } else if (error instanceof CircularReferenceException) {
          VSCodeEnvironment.showErrorMessage(error.message);
        } else if (error instanceof RecursionDepthException) {
          VSCodeEnvironment.showWarningMessage(error.message);
        } else if (error instanceof Error && error.message.startsWith('File not found:')) {
          VSCodeEnvironment.showInformationMessage(`File not found, keeping original reference: ${filePath}`);
        } else {
          // For other errors, show error message
          const errorMessage = error instanceof Error ? error.message : String(error);
          VSCodeEnvironment.showErrorMessage(`Error expanding file reference: ${errorMessage}`);
        }
        
        // Keep the original reference in the text
        result = result.replace(fullMatch, fullMatch);
      }
    }
    
    return result;
  }
  
  /**
   * Resolves a file path, handling both absolute and relative paths
   * @param filePath The file path to resolve
   * @param basePath The base path for resolving relative paths
   * @returns The resolved absolute file path
   */
  private static async resolveFilePath(filePath: string, basePath: string): Promise<string> {
    const result = await FileResolver.resolveFilePath(filePath, basePath);
    
    if (!result.success) {
      // Get suggestions for similar files
      const suggestions = await FileResolver.getSuggestions(filePath);
      const suggestionText = suggestions.length > 0 
        ? `\nSimilar files found:\n${suggestions.join('\n')}` 
        : '';
      
      throw new Error(`File not found: ${filePath}${suggestionText}`);
    }
    
    return result.path;
  }
  
  // Cache for file content to improve performance with timestamp tracking
  private static fileContentCache: Map<string, { content: string, timestamp: number }> = new Map();
  
  /**
   * Reads the content of a file
   * @param filePath The path to the file
   * @returns The content of the file
   * @throws LargeDataException if the file size exceeds the configured limit
   */
  private static async readFileContent(filePath: string): Promise<string> {
    try {
      // Get file stats to check timestamp
      const stats = fs.statSync(filePath);
      const lastModified = stats.mtime.getTime();
      
      // Check cache first for better performance
      const cacheEntry = this.fileContentCache.get(filePath);
      
      // Use cache only if entry exists and timestamp matches
      if (cacheEntry && cacheEntry.timestamp === lastModified) {
        return cacheEntry.content;
      }
    
      // Get maximum file size from configuration
      const MAX_FILE_SIZE = VSCodeEnvironment.getConfiguration(
        'inlined-copy', 
        'maxFileSize', 
        1024 * 1024 * 5 // 5MB default
      );
      
      // Check file size before reading
      if (stats.size > MAX_FILE_SIZE) {
        throw new LargeDataException(`File size (${(stats.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed limit (${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB)`);
      }
      
      // For files approaching the size limit, use streaming to reduce memory usage
      if (stats.size > MAX_FILE_SIZE / 2) {
        return this.readFileContentStreaming(filePath);
      }
      
      // For smaller files, use regular file reading
      const content = await new Promise<string>((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            reject(new Error(`Failed to read file: ${err.message}`));
            return;
          }
          
          resolve(data);
        });
      });
      
      // Cache the content with timestamp
      this.fileContentCache.set(filePath, {
        content,
        timestamp: lastModified
      });
      
      return content;
    } catch (error) {
      if (error instanceof LargeDataException) {
        throw error;
      }
      throw new Error(`Failed to access file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Reads the content of a file using streaming for better memory efficiency
   * @param filePath The path to the file
   * @returns The content of the file
   */
  private static readFileContentStreaming(filePath: string): Promise<string> {
    // Create a promise to read the file using streaming
    return new Promise<string>((resolve, reject) => {
      // Get file stats to check timestamp
      let lastModified: number;
      try {
        const stats = fs.statSync(filePath);
        lastModified = stats.mtime.getTime();
      } catch (error) {
        reject(new Error(`Failed to get file stats: ${error instanceof Error ? error.message : String(error)}`));
        return;
      }
      
      const chunks: Buffer[] = [];
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      
      stream.on('error', (err) => {
        reject(new Error(`Failed to read file stream: ${err.message}`));
      });
      
      stream.on('end', () => {
        const content = Buffer.concat(chunks).toString('utf8');
        // Cache the content with timestamp
        this.fileContentCache.set(filePath, {
          content,
          timestamp: lastModified
        });
        resolve(content);
      });
    });
  }
  
  /**
   * Clears the file content cache
   * Should be called when files are modified
   */
  public static clearCache(): void {
    this.fileContentCache.clear();
  }
}
