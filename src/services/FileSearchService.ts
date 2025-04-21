import * as vscode from 'vscode';
import * as path from 'path';
import { LogWrapper, SingletonBase } from '../utils';

/**
 * ファイル検索の結果型
 */
export type FileSearchResult = {
  path?: string;
  error?: string;
};

/**
 * ファイル検索のためのインターフェース
 */
export interface IFileSearchService {
  /**
   * 指定されたベースパスにあるファイルを検索する
   * @param filePath 検索するファイルのパス
   * @param basePath 検索の基準となるパス
   * @returns 検索結果
   */
  findFileInBase(filePath: string, basePath: string): Promise<FileSearchResult>;

  /**
   * 指定されたパスの親パスを取得する
   * @param basePath 基準となるパス
   * @returns 親パスの結果
   */
  findParent(basePath: string): Promise<FileSearchResult>;
}

/**
 * ファイル検索を行うサービスクラス
 */
export class FileSearchService
  extends SingletonBase<IFileSearchService>
  implements IFileSearchService
{
  /**
   * 指定されたベースパスにあるファイルを検索する
   * @param filePath 検索するファイルのパス
   * @param basePath 検索の基準となるパス
   * @returns 検索結果
   */
  public async findFileInBase(filePath: string, basePath: string): Promise<FileSearchResult> {
    try {
      const workspaceRoot = this.getWorkspaceRoot();
      if (!workspaceRoot) {
        LogWrapper.Instance().error('ワークスペースが見つかりません');
        return { error: 'ワークスペースが見つかりません' };
      }

      // ワークスペース外のパスが与えられた場合はエラー
      if (!this.isPathInWorkspace(basePath, workspaceRoot)) {
        return { error: 'ワークスペース外のパスが指定されました' };
      }

      const pathInfo = this.parseFilePathInfo(filePath);
      const relativeBase = path.relative(workspaceRoot, basePath);
      const searchPattern = this.buildSearchPattern(relativeBase, pathInfo);

      const files = await vscode.workspace.findFiles(searchPattern, '**/node_modules/**', 10);
      const result = this.processFoundFiles(files, pathInfo, relativeBase, workspaceRoot);

      if (result) {
        return { path: result };
      }

      return { error: `ファイルが見つかりません: ${filePath}` };
    } catch (error) {
      const errorMessage = `エラー: ${error instanceof Error ? error.message : String(error)}`;
      LogWrapper.Instance().error(`ファイル検索エラー: ${error}`);
      return { error: errorMessage };
    }
  }

  /**
   * 指定されたパスの親パスを取得する
   * @param basePath 基準となるパス
   * @returns 親パスの結果
   */
  public async findParent(basePath: string): Promise<FileSearchResult> {
    try {
      const workspaceRoot = this.getWorkspaceRoot();
      if (!workspaceRoot) {
        LogWrapper.Instance().error('ワークスペースが見つかりません');
        return { error: 'ワークスペースが見つかりません' };
      }

      // ワークスペース外のパスが与えられた場合はエラー
      if (!this.isPathInWorkspace(basePath, workspaceRoot)) {
        return { error: 'ワークスペース外のパスが指定されました' };
      }

      const parentPath = path.dirname(basePath);

      // 親パスがパス自身と同じ場合（ルートディレクトリの場合）
      if (parentPath === basePath) {
        return { error: '親ディレクトリが存在しません' };
      }

      // 親パスがワークスペース外の場合
      if (!this.isPathInWorkspace(parentPath, workspaceRoot)) {
        return { error: 'ワークスペース外のパスが検出されました' };
      }

      return { path: parentPath };
    } catch (error) {
      const errorMessage = `エラー: ${error instanceof Error ? error.message : String(error)}`;
      LogWrapper.Instance().error(`親パス取得エラー: ${error}`);
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

  private isPathInWorkspace(checkPath: string, workspaceRoot: string): boolean {
    const normalizedCheckPath = path.normalize(checkPath);
    const normalizedWorkspacePath = path.normalize(workspaceRoot);
    return normalizedCheckPath.startsWith(normalizedWorkspacePath);
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
