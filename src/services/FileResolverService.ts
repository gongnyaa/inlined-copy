import * as vscode from 'vscode';
import * as path from 'path';
import { LogWrapper, SingletonBase } from '../utils';

/**
 * ファイル解決の結果型
 */
export type FileResult = {
  path?: string;
  error?: string;
};

/**
 * ファイル解決のためのインターフェース
 */
export interface IFileResolver {
  resolveFilePath(filePath: string, basePath: string): Promise<FileResult>;
}

/**
 * ファイル解決を行うサービスクラス
 */
export class FileResolverService extends SingletonBase<IFileResolver> implements IFileResolver {
  /**
   * ファイルパスを解決する
   * @param filePath 解決するファイルパス
   * @param basePath 基準となるパス
   * @returns 解決結果
   */
  public async resolveFilePath(filePath: string, basePath: string): Promise<FileResult> {
    try {
      const workspaceRoot = this.getWorkspaceRoot();
      if (!workspaceRoot) {
        LogWrapper.Instance().error('ワークスペースが見つかりません');
        return { error: 'ワークスペースが見つかりません' };
      }

      const pathInfo = this.parseFilePathInfo(filePath);
      return await this.searchFileInParentDirectories(pathInfo, basePath, workspaceRoot);
    } catch (error) {
      const errorMessage = `エラー: ${error instanceof Error ? error.message : String(error)}`;
      LogWrapper.Instance().error(`ファイル解決エラー: ${error}`);
      return { error: errorMessage };
    }
  }

  private getWorkspaceRoot(): string | null {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return null;
    }
    return workspaceFolders[0].uri.fsPath;
  }

  private parseFilePathInfo(filePath: string): {
    parsedPath: path.ParsedPath;
    hasExtension: boolean;
    hasParentFolder: boolean;
    parentFolder: string;
    baseSearchPattern: string;
  } {
    const parsedPath = path.parse(filePath);
    const hasExtension = parsedPath.ext !== '';
    const hasParentFolder = parsedPath.dir !== '';
    const parentFolder = hasParentFolder ? parsedPath.dir : '';
    const baseSearchPattern = hasExtension ? parsedPath.base : `${parsedPath.name}.*`;

    return {
      parsedPath,
      hasExtension,
      hasParentFolder,
      parentFolder,
      baseSearchPattern,
    };
  }

  private async searchFileInParentDirectories(
    pathInfo: {
      parsedPath: path.ParsedPath;
      hasExtension: boolean;
      hasParentFolder: boolean;
      parentFolder: string;
      baseSearchPattern: string;
    },
    basePath: string,
    workspaceRoot: string
  ): Promise<FileResult> {
    let currentPath = basePath;

    while (currentPath.startsWith(workspaceRoot)) {
      const relativeBase = path.relative(workspaceRoot, currentPath);
      const searchPattern = this.buildSearchPattern(relativeBase, pathInfo);

      const files = await vscode.workspace.findFiles(searchPattern, '**/node_modules/**', 10);
      const result = this.processFoundFiles(files, pathInfo, relativeBase, workspaceRoot);

      if (result) {
        return { path: result };
      }

      const parentPath = path.dirname(currentPath);
      if (parentPath === currentPath) {
        break;
      }
      currentPath = parentPath;
    }

    const errorMessage = `ファイルが見つかりません: ${pathInfo.parsedPath.base}`;
    LogWrapper.Instance().error(errorMessage);
    return { error: errorMessage };
  }

  private buildSearchPattern(
    relativeBase: string,
    pathInfo: { hasParentFolder: boolean; parentFolder: string; baseSearchPattern: string }
  ): string {
    if (pathInfo.hasParentFolder) {
      return path.join(relativeBase, pathInfo.parentFolder, pathInfo.baseSearchPattern);
    } else {
      return path.join(relativeBase, '**', pathInfo.baseSearchPattern);
    }
  }

  private processFoundFiles(
    files: vscode.Uri[],
    pathInfo: { hasParentFolder: boolean; parentFolder: string },
    relativeBase: string,
    workspaceRoot: string
  ): string | null {
    if (files.length === 0) {
      return null;
    }

    if (pathInfo.hasParentFolder) {
      const matchingFiles = this.filterFilesByParentDirectory(
        files,
        workspaceRoot,
        relativeBase,
        pathInfo.parentFolder
      );

      if (matchingFiles.length > 0) {
        return matchingFiles[0].fsPath;
      }
      return null;
    } else {
      return files[0].fsPath;
    }
  }

  private filterFilesByParentDirectory(
    files: vscode.Uri[],
    workspaceRoot: string,
    relativeBase: string,
    parentFolder: string
  ): vscode.Uri[] {
    return files.filter(file => {
      const relativeFilePath = path.relative(workspaceRoot, file.fsPath);
      const actualParentDir = path.dirname(relativeFilePath);
      const expectedParentDir = path.join(relativeBase, parentFolder);
      return actualParentDir === expectedParentDir;
    });
  }
}
