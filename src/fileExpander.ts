import * as vscode from 'vscode';
import * as fs from 'fs';
import { SectionExtractor } from './sectionExtractor';
import { FileResolver } from './fileResolver/fileResolver';

/**
 * Expands file references in the format ![[filename]] or ![[filename#heading]] with the content of the referenced file
 */
export class FileExpander {
  /**
   * Expands file references in the given text
   * @param text The text containing file references
   * @param basePath The base path to resolve relative file paths
   * @returns The expanded text with file references replaced by their content
   */
  public static async expandFileReferences(text: string, basePath: string): Promise<string> {
    // Regular expression to match ![[filename]] or ![[filename#heading]] patterns
    const fileReferenceRegex = /!\[\[(.*?)(?:#(.*?))?\]\]/g;
    
    let result = text;
    let match;
    
    // Find all file references in the text
    while ((match = fileReferenceRegex.exec(text)) !== null) {
      const fullMatch = match[0]; // The entire ![[filename]] or ![[filename#heading]] match
      const filePath = match[1].trim(); // The filename part
      const heading = match[2] ? match[2].trim() : null; // The heading part if present
      
      try {
        // Resolve the file path (handle both absolute and relative paths)
        const resolvedPath = await this.resolveFilePath(filePath, basePath);
        
        // Read the file content
        const fileContent = await this.readFileContent(resolvedPath);
        
        // Extract section if heading is specified
        let contentToInsert = fileContent;
        if (heading) {
          const sectionContent = SectionExtractor.extractSection(fileContent, heading);
          if (sectionContent) {
            contentToInsert = sectionContent;
          } else {
            vscode.window.showWarningMessage(`Heading "${heading}" not found in file "${filePath}"`);
          }
        }
        
        // Replace the file reference with the file content
        result = result.replace(fullMatch, contentToInsert);
      } catch (error) {
        // If file not found or other error, leave the reference as is and log error
        console.error(`Error expanding file reference ${fullMatch}: ${error}`);
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Error expanding file reference: ${errorMessage}`);
        
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
    const resolvedPath = await FileResolver.resolveFilePath(filePath, basePath);
    
    if (!resolvedPath) {
      // Get suggestions for similar files
      const suggestions = await FileResolver.getSuggestions(filePath);
      const suggestionText = suggestions.length > 0 
        ? `\nSimilar files found:\n${suggestions.join('\n')}` 
        : '';
      
      throw new Error(`File not found: ${filePath}${suggestionText}`);
    }
    
    return resolvedPath;
  }
  
  /**
   * Reads the content of a file
   * @param filePath The path to the file
   * @returns The content of the file
   */
  private static async readFileContent(filePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          reject(new Error(`Failed to read file: ${err.message}`));
          return;
        }
        
        resolve(data);
      });
    });
  }
}
