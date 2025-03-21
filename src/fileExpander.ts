import * as path from 'path';
import { SectionExtractor } from './sectionExtractor';
import { FileResolver } from './fileResolver/fileResolver';
import { FileReader } from './fileReader';
import { parseReference, ReferenceType } from './referenceParser';
import {
  LargeDataException,
  DuplicateReferenceException,
  CircularReferenceException,
  RecursionDepthException,
} from './errors/errorTypes';
import { VSCodeEnvironment } from './utils/vscodeEnvironment';
import { LogManager } from './utils/logManager';

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
  public static async expandFileReferences(
    text: string,
    basePath: string,
    visitedPaths: string[] = [],
    currentDepth = 0
  ): Promise<string> {
    LogManager.debug(`Expanding file references at depth ${currentDepth}`);
    // Get maximum recursion depth from configuration
    const maxRecursionDepth = VSCodeEnvironment.getConfiguration(
      'inlined-copy',
      'maxRecursionDepth',
      1
    );

    // Check if recursion depth exceeds limit
    if (currentDepth > maxRecursionDepth) {
      LogManager.debug(
        `Recursion depth ${currentDepth} exceeds maximum ${maxRecursionDepth}, throwing exception.`
      );
      throw new RecursionDepthException(`Maximum recursion depth (${maxRecursionDepth}) exceeded`);
    }

    // Regular expression to match all reference patterns
    const fileReferenceRegex = /!\[\[(.*?)\]\]/g;

    let result = text;
    let match;

    // Track processed files to detect duplicates
    const processedFiles = new Set<string>();

    // Find all file references in the text
    while ((match = fileReferenceRegex.exec(text)) !== null) {
      const fullMatch = match[0]; // The entire ![[...]] match

      try {
        // Parse the reference
        const reference = parseReference(fullMatch);
        const filePath = reference.filePath;

        if (!filePath) {
          LogManager.warn(`Invalid reference: ${fullMatch}`);
          continue;
        }

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
          throw new DuplicateReferenceException(`Duplicate reference detected: ${relativePath}`);
        }

        // Add to processed files
        processedFiles.add(resolvedPath);

        // Read the file content
        const fileContent = await FileReader.readFile(resolvedPath);

        // Process the content based on reference type
        let contentToInsert = fileContent;

        switch (reference.type) {
          case ReferenceType.singleHeading:
            // For single heading references
            if (reference.headingPath && reference.headingPath.length > 0) {
              const sectionContent = SectionExtractor.extractSection(
                fileContent,
                reference.headingPath[0]
              );
              if (sectionContent) {
                contentToInsert = sectionContent;
              } else {
                LogManager.warn(
                  `Heading "${reference.headingPath[0]}" not found in file "${filePath}"`
                );
                continue;
              }
            }
            break;

          case ReferenceType.nestedHeading:
            // For nested heading references
            if (reference.headingPath && reference.headingPath.length > 0) {
              const sectionContent = SectionExtractor.extractNestedSection(
                fileContent,
                reference.headingPath
              );
              if (sectionContent) {
                contentToInsert = sectionContent;
              } else {
                const headingPathStr = reference.headingPath.join('#');
                LogManager.warn(
                  `Nested heading path "${headingPathStr}" not found in file "${filePath}"`
                );
                continue;
              }
            }
            break;

          case ReferenceType.fileOnly:
          default:
            // Use the whole file content (default)
            break;
        }

        // Recursively expand nested references in the inserted content
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
        // Error handling
        if (
          error instanceof LargeDataException ||
          error instanceof DuplicateReferenceException ||
          error instanceof CircularReferenceException ||
          error instanceof RecursionDepthException
        ) {
          LogManager.warn(error.message, true);
          result = result.replace(fullMatch, `<!-- ${error.message} -->`);
        } else if (error instanceof Error && error.message.startsWith('File not found:')) {
          // Display as Info instead of Error and use more concise format
          LogManager.info(`Reference was not found: ${fullMatch}`, true);
          // Keep the original reference
          result = result.replace(fullMatch, fullMatch);
        } else {
          // Show appropriate message based on error type
          if (error instanceof Error) {
            LogManager.error(`Error expanding reference ${fullMatch}: ${error.message}`);
          } else {
            LogManager.error(`Unknown error expanding reference ${fullMatch}`);
          }
          result = result.replace(fullMatch, fullMatch); // Keep the original reference
        }
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
      // Get suggestions for similar files but don't include in the error message
      await FileResolver.getSuggestions(filePath);

      throw new Error(`File not found: ${filePath}`);
    }

    return result.path;
  }

  /**
   * Clears the file content cache in FileReader
   * Should be called when files are modified
   */
  public static clearCache(): void {
    FileReader.clearCache();
  }
}
