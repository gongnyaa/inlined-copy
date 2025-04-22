import { LogWrapper, PathWrapper, SingletonBase, VSCodeWrapper } from '../utils';
import { FileSearchError } from '../errors/ErrorTypes';

/**
 * ファイル検索のためのインターフェース
 */
export interface IFileSearchService {
  /**
   * 指定されたベースパスにあるファイルを検索する
   * @param filePath 検索するファイルのパス
   * @param basePath 検索の基準となるパス
   * @returns 検索されたファイルの完全修飾パス
   * @throws FileSearchError ファイルが見つからない場合 (type: NotFound)
   * @throws FileSearchError ワークスペースが見つからない場合 (type: NoWorkspace)
   * @throws FileSearchError ワークスペース外のパスが指定された場合 (type: OutsideWorkspace)
   */
  findFileInBase(filePath: string, basePath: string): Promise<string>;

  /**
   * 指定されたパスの親パスを取得する
   * @param basePath 基準となるパス
   * @returns 親パスの完全修飾パス
   * @throws FileSearchError ワークスペースが見つからない場合 (type: NoWorkspace)
   * @throws FileSearchError ワークスペース外のパスが指定された場合 (type: OutsideWorkspace)
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
  // 定数定義
  private static readonly MAX_RESULTS = 10;
  private static readonly NODE_MODULES_PATTERN = '**/node_modules/**';
  private static readonly WILDCARD_PATTERN = '**';

  public async hasInBase(filePath: string, basePath: string): Promise<boolean> {
    try {
      // ワークスペース外のパスが指定された場合は常にfalseを返す
      if (!this.isInProject(basePath)) {
        return false;
      }

      const fileName = PathWrapper.Instance().basename(filePath);
      const uri = VSCodeWrapper.Instance().createUri(basePath);
      const pattern = VSCodeWrapper.Instance().createRelativePattern(uri, `**/${fileName}`);
      const files = await VSCodeWrapper.Instance().findFiles(pattern, null, 1);
      return files.length > 0;
    } catch {
      return false;
    }
  }

  public async findFileInBase(filePath: string, basePath: string): Promise<string> {
    try {
      this.ensureWorkspace(basePath);

      const workspaceRoot = VSCodeWrapper.Instance().getWorkspaceRootPath()!;
      const result = await PathWrapper.Instance().findFileInWorkspace(
        workspaceRoot,
        basePath,
        filePath,
        FileSearchService.NODE_MODULES_PATTERN,
        FileSearchService.MAX_RESULTS
      );

      if (!result) {
        throw new FileSearchError('NotFound', `file_not_found:${filePath}`);
      }

      return result;
    } catch (error) {
      this.handleError('find_file_error', error);
      throw error;
    }
  }

  public async findParent(basePath: string): Promise<string> {
    try {
      this.ensureWorkspace(basePath);
      return PathWrapper.Instance().dirname(basePath);
    } catch (error) {
      this.handleError('find_parent_error', error);
      throw error;
    }
  }

  public isInProject(checkPath: string): boolean {
    const workspaceRoot = VSCodeWrapper.Instance().getWorkspaceRootPath();
    if (!workspaceRoot) return false;

    return this.isPathInWorkspace(checkPath, workspaceRoot);
  }

  private ensureWorkspace(basePath: string): void {
    const workspaceRoot = VSCodeWrapper.Instance().getWorkspaceRootPath();
    if (!workspaceRoot) {
      throw new FileSearchError('NoWorkspace', 'workspace_not_found');
    }

    if (!this.isPathInWorkspace(basePath, workspaceRoot)) {
      throw new FileSearchError('OutsideWorkspace', 'path_outside_workspace');
    }
  }

  private isPathInWorkspace(checkPath: string, workspaceRoot: string): boolean {
    return PathWrapper.Instance().isPathInside(checkPath, workspaceRoot);
  }

  private handleError(key: string, error: unknown): void {
    if (error instanceof FileSearchError) {
      LogWrapper.Instance().error(`${key}: type=${error.type}, message=${error.message}`);
    } else {
      const message = error instanceof Error ? error.message : String(error);
      LogWrapper.Instance().error(`${key}: message=${message}`);
      throw new Error(message);
    }
  }
}
