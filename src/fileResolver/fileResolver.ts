import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { FileResult, fileSuccess, fileFailure } from './fileResult';
import { VSCodeEnvironment } from '../utils/vscodeEnvironment';
import { LogManager } from '../utils/logManager';

/**
 * Intelligent file path resolution for the inlined-copy extension
 */
export class FileResolver {
  public static async resolveFilePath(filePath: string, basePath: string): Promise<FileResult> {
    const directPath = this.resolveDirectPath(filePath, basePath);
    if (directPath) {
      return fileSuccess(directPath);
    }

    const rootBasedPath = await this.resolveFromProjectRoot(filePath);
    if (rootBasedPath) {
      return fileSuccess(rootBasedPath);
    }

    const proximityPath = await this.resolveByProximity(filePath, basePath);
    if (proximityPath) {
      return fileSuccess(proximityPath);
    }

    const candidates = await this.findFileInWorkspace(filePath);
    if (candidates.length > 0) {
      const bestCandidate = await this.selectBestFileCandidate(candidates, basePath);
      if (bestCandidate) {
        return fileSuccess(bestCandidate);
      }
    }

    return fileFailure(`File not found: ${filePath}`);
  }

  private static resolveDirectPath(filePath: string, basePath: string): string | null {
    let resolvedPath: string;

    if (path.isAbsolute(filePath)) {
      resolvedPath = filePath;
    } else {
      resolvedPath = path.resolve(basePath, filePath);
    }

    return fs.existsSync(resolvedPath) ? resolvedPath : null;
  }

  private static async resolveFromProjectRoot(filePath: string): Promise<string | null> {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
      return null;
    }

    const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;

    for (const folder of vscode.workspace.workspaceFolders) {
      const rootPath = folder.uri.fsPath;
      const fullPath = path.join(rootPath, normalizedPath);

      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }

    return null;
  }

  private static async resolveByProximity(
    filePath: string,
    basePath: string
  ): Promise<string | null> {
    const MAX_DEPTH = VSCodeEnvironment.getConfiguration('inlined-copy', 'maxSearchDepth', 3);

    let currentDir = basePath;
    const filename = path.basename(filePath);

    for (let i = 0; i <= MAX_DEPTH; i++) {
      const testPath = path.join(currentDir, filename);
      if (fs.existsSync(testPath)) {
        return testPath;
      }

      const parentDir = path.dirname(currentDir);

      if (parentDir === currentDir) {
        break;
      }

      currentDir = parentDir;
    }

    return null;
  }

  private static async findFileInWorkspace(filePath: string): Promise<string[]> {
    const filename = path.basename(filePath);
    const filenameWithoutExt = path.basename(filename, path.extname(filename));
    const searchPattern = `**/${filenameWithoutExt}*`;

    try {
      const uris = await vscode.workspace.findFiles(searchPattern, '**/node_modules/**', 10);

      return uris.map(uri => uri.fsPath);
    } catch (error) {
      LogManager.error(`Error searching for files: ${error}`);
      LogManager.error(
        `Error searching for files: ${error instanceof Error ? error.message : String(error)}`,
        true
      );
      return [];
    }
  }

  private static async selectBestFileCandidate(
    candidates: string[],
    basePath: string
  ): Promise<string | null> {
    if (candidates.length === 0) {
      return null;
    }

    if (candidates.length === 1) {
      return candidates[0];
    }

    const scoredCandidates = candidates.map(filePath => {
      const baseSegments = basePath.split(path.sep);
      const fileSegments = filePath.split(path.sep);

      let commonSegments = 0;
      for (let i = 0; i < Math.min(baseSegments.length, fileSegments.length); i++) {
        if (baseSegments[i] === fileSegments[i]) {
          commonSegments++;
        } else {
          break;
        }
      }

      const proximityScore = baseSegments.length + fileSegments.length - 2 * commonSegments;

      return {
        filePath,
        proximityScore,
      };
    });

    scoredCandidates.sort((a, b) => a.proximityScore - b.proximityScore);

    return scoredCandidates[0].filePath;
  }

  public static async getSuggestions(filePath: string): Promise<string[]> {
    const filename = path.basename(filePath);
    const filenameWithoutExt = path.basename(filename, path.extname(filename));
    const searchPattern = `**/${filenameWithoutExt}*`;

    try {
      const uris = await vscode.workspace.findFiles(searchPattern, '**/node_modules/**', 5);

      return uris.map(uri => vscode.workspace.asRelativePath(uri));
    } catch (error) {
      LogManager.error(`Error getting suggestions: ${error}`);
      LogManager.error(
        `Error getting file suggestions: ${error instanceof Error ? error.message : String(error)}`,
        true
      );
      return [];
    }
  }
}
