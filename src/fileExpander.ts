import * as fs from 'fs';
import * as path from 'path';
import { FileResolver } from './fileResolver/fileResolver';
import {
  LargeDataException,
  CircularReferenceException,
  RecursionDepthException,
} from './errors/errorTypes';
import { VSCodeEnvironment } from './utils/vscodeEnvironment';
import { LogManager } from './utils/logManager';

export class FileExpander {
  public static async expandFileReferences(
    text: string,
    basePath: string,
    visitedPaths: string[] = [],
    currentDepth = 0
  ): Promise<string> {
    LogManager.log(`Expanding file references at depth ${currentDepth}`);

    const MAX_RECURSION_DEPTH = VSCodeEnvironment.getConfiguration(
      'inlined-copy',
      'maxRecursionDepth',
      1
    );

    if (currentDepth > MAX_RECURSION_DEPTH) {
      LogManager.log(`Recursion depth ${currentDepth} exceeds maximum ${MAX_RECURSION_DEPTH}`);
      throw new RecursionDepthException(
        `Maximum recursion depth (${MAX_RECURSION_DEPTH}) exceeded`
      );
    }

    const fileReferenceRegex = /!\[\[(.*?)\]\]/g;
    let result = text;
    let match;

    while ((match = fileReferenceRegex.exec(text)) !== null) {
      const fullMatch = match[0];
      const filePath = match[1].trim();

      try {
        const resolvedPath = await this.resolveFilePath(filePath, basePath);

        if (visitedPaths.includes(resolvedPath)) {
          const pathChain = [...visitedPaths, resolvedPath].map(p => path.basename(p)).join(' → ');
          throw new CircularReferenceException(`Circular reference detected: ${pathChain}`);
        }

        const fileContent = await this.readFileContent(resolvedPath);
        let contentToInsert = fileContent;

        const newVisitedPaths = [...visitedPaths, resolvedPath];
        contentToInsert = await this.expandFileReferences(
          contentToInsert,
          path.dirname(resolvedPath),
          newVisitedPaths,
          currentDepth + 1
        );

        result = result.replace(fullMatch, contentToInsert);
      } catch (error) {
        if (error instanceof Error && error.message.startsWith('File not found:')) {
          LogManager.log(`![[${filePath}]] was not found`);
        } else {
          if (error instanceof LargeDataException) {
            LogManager.log(`Large file detected: ${error.message}`);
          } else if (error instanceof CircularReferenceException) {
            LogManager.error(error.message);
          } else if (error instanceof RecursionDepthException) {
            LogManager.error(error.message);
          } else {
            const errorMessage = error instanceof Error ? error.message : String(error);
            LogManager.error(`Error expanding file reference: ${errorMessage}`);
            throw error;
          }
        }

        result = result.replace(fullMatch, fullMatch);
      }
    }

    return result;
  }

  private static async resolveFilePath(filePath: string, basePath: string): Promise<string> {
    const result = await FileResolver.resolveFilePath(filePath, basePath);

    if (!result.success) {
      await FileResolver.getSuggestions(filePath);
      throw new Error(`File not found: ${filePath}`);
    }

    return result.path;
  }

  private static async readFileContent(filePath: string): Promise<string> {
    try {
      const stats = fs.statSync(filePath);

      const MAX_FILE_SIZE = VSCodeEnvironment.getConfiguration(
        'inlined-copy',
        'maxFileSize',
        1024 * 1024 * 5 // 5MB default
      );

      if (stats.size > MAX_FILE_SIZE) {
        throw new LargeDataException(
          `File size (${(stats.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed limit (${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB)`
        );
      }

      if (stats.size > MAX_FILE_SIZE / 2) {
        return this.readFileContentStreaming(filePath);
      }

      return await new Promise<string>((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            reject(new Error(`Failed to read file: ${err.message}`));
            return;
          }
          resolve(data);
        });
      });
    } catch (error) {
      if (error instanceof LargeDataException) {
        throw error;
      }
      throw new Error(
        `Failed to access file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private static readFileContentStreaming(filePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = fs.createReadStream(filePath);

      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on('error', err => {
        reject(new Error(`Failed to read file stream: ${err.message}`));
      });

      stream.on('end', () => {
        const content = Buffer.concat(chunks).toString('utf8');
        resolve(content);
      });
    });
  }
}
