import * as vscode from 'vscode';
import * as path from 'path';
import { LogWrapper, SingletonBase } from '../utils';

/**
 * ファイル検索のためのインターフェース
 */
export interface IFileSearchService {
  /**
   * 指定されたベースパスにあるファイルを検索する
   * @param filePath 検索するファイルのパス
   * @param basePath 検索の基準となるパス
   * @returns 検索されたファイルの完全修飾パス
   * @throws Error ファイルが見つからない場合
   * @throws Error ワークスペースが見つからない場合
   * @throws Error ワークスペース外のパスが指定された場合
   */
  findFileInBase(filePath: string, basePath: string): Promise<string>;

  /**
   * 指定されたパスの親パスを取得する
   * @param basePath 基準となるパス
   * @returns 親パスの完全修飾パス
   * @throws Error 親ディレクトリが存在しない場合
   * @throws Error ワークスペースが見つからない場合
   * @throws Error ワークスペース外のパスが指定された場合
   */
  findParent(basePath: string): Promise<string>;

  /**
   * 指定されたパスがプロジェクト内にあるかどうかを判定する
   * @param checkPath 判定するパス
   * @returns プロジェクト内にある場合はtrue
   */
  isInProject(checkPath: string): boolean;

  /**
   * 指定されたファイルが指定されたベースパスにあるかどうかを判定する
   * @param filePath 判定するファイルのパス
   * @param basePath 判定の基準となるパス
   * @returns ファイルがベースパスにある場合はtrue
   */
  hasInBase(filePath: string, basePath: string): Promise<boolean>;
}

/**
 * ファイル検索を行うサービスクラス
 */
export class FileSearchService
  extends SingletonBase<IFileSearchService>
  implements IFileSearchService
{
  /**
   * filePath と同名のファイルが basePath 直下 (再帰) に存在するか判定
   */
  public async hasInBase(filePath: string, basePath: string): Promise<boolean> {
    // ベースパスを VS Code が理解できる URI に
    const baseUri = vscode.Uri.file(basePath);
    const fileName = path.basename(filePath);

    // basePath/**/fileName だけを対象に検索
    const pattern = new vscode.RelativePattern(baseUri, `**/${fileName}`);
    const [hit] = await vscode.workspace.findFiles(pattern, null, 1); // 1 件で十分

    return Boolean(hit); // ヒットがあれば OK
  }
  /**
   * 指定されたベースパスにあるファイルを検索する
   * @param filePath 検索するファイルのパス
   * @param basePath 検索の基準となるパス
   * @returns 検索されたファイルの完全修飾パス
   * @throws Error ファイルが見つからない場合
   * @throws Error ワークスペースが見つからない場合
   * @throws Error ワークスペース外のパスが指定された場合
   */
  public async findFileInBase(filePath: string, basePath: string): Promise<string> {
    try {
      const workspaceRoot = this.getWorkspaceRoot();
      if (!workspaceRoot) {
        LogWrapper.Instance().error('ワークスペースが見つかりません');
        throw new Error('ワークスペースが見つかりません');
      }

      // ワークスペース外のパスが与えられた場合はエラー
      if (!this.isPathInWorkspace(basePath, workspaceRoot)) {
        throw new Error('ワークスペース外のパスが指定されました');
      }

      const pathInfo = this.parseFilePathInfo(filePath);
      const relativeBase = path.relative(workspaceRoot, basePath);
      const searchPattern = this.buildSearchPattern(relativeBase, pathInfo);

      const files = await vscode.workspace.findFiles(searchPattern, '**/node_modules/**', 10);
      const result = this.processFoundFiles(files, pathInfo, relativeBase, workspaceRoot);

      if (result) {
        return result;
      }

      throw new Error(`ファイルが見つかりません: ${filePath}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      LogWrapper.Instance().error(`ファイル検索エラー: ${error}`);
      throw new Error(errorMessage);
    }
  }

  /**
   * 指定されたパスの親パスを取得する
   * @param basePath 基準となるパス
   * @returns 親パスの完全修飾パス
   * @throws Error 親ディレクトリが存在しない場合
   * @throws Error ワークスペースが見つからない場合
   * @throws Error ワークスペース外のパスが指定された場合
   */
  public async findParent(basePath: string): Promise<string> {
    try {
      const workspaceRoot = this.getWorkspaceRoot();
      if (!workspaceRoot) {
        LogWrapper.Instance().error('ワークスペースが見つかりません');
        throw new Error('ワークスペースが見つかりません');
      }

      // ワークスペース外のパスが与えられた場合はエラー
      if (!this.isPathInWorkspace(basePath, workspaceRoot)) {
        throw new Error('ワークスペース外のパスが指定されました');
      }

      const parentPath = path.dirname(basePath);

      return parentPath;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      LogWrapper.Instance().error(`親パス取得エラー: ${error}`);
      throw new Error(errorMessage);
    }
  }

  /**
   * 指定されたパスがプロジェクト内にあるかどうかを判定する
   * @param checkPath 判定するパス
   * @returns プロジェクト内にある場合はtrue
   */
  public isInProject(checkPath: string): boolean {
    const workspaceRoot = this.getWorkspaceRoot();
    if (!workspaceRoot) {
      return false;
    }
    return this.isPathInWorkspace(checkPath, workspaceRoot);
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
