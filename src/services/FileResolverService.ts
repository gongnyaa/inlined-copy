import { LogWrapper, SingletonBase } from '../utils';
import { FileSearchService } from './FileSearchService';

/**
 * ファイル解決のためのインターフェース
 */
export interface IFileResolver {
  /**
   * ファイルパスを解決する
   * @param filePath 解決するファイルパス
   * @param basePath 基準となるパス
   * @returns 解決されたファイルパスの完全修飾パス
   * @throws Error ファイルが見つからない場合
   * @throws Error ファイル解決に失敗した場合
   */
  resolveFilePath(filePath: string, basePath: string): Promise<string>;
}

/**
 * ファイル解決を行うサービスクラス
 */
export class FileResolverService extends SingletonBase<IFileResolver> implements IFileResolver {
  /**
   * ファイルパスを解決する
   * @param filePath 解決するファイルパス
   * @param basePath 基準となるパス
   * @returns 解決されたファイルパスの完全修飾パス
   * @throws Error ファイルが見つからない場合
   * @throws Error ファイル解決に失敗した場合
   */
  public async resolveFilePath(filePath: string, basePath: string): Promise<string> {
    try {
      const fileSearchService = FileSearchService.Instance();

      // まず指定のbasePathで検索
      const result = await fileSearchService.findFileInBase(filePath, basePath);
      if (result.error) {
        // 親ディレクトリを辿って検索
        return await this.searchInParentDirectories(filePath, basePath);
      }

      if (!result.path) {
        throw new Error(`予期せぬエラー: ファイルパスが取得できませんでした - ${filePath}`);
      }

      return result.path;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      LogWrapper.Instance().error(`ファイル解決エラー: ${errorMessage}`);
      throw new Error(`ファイル解決に失敗: ${errorMessage}`);
    }
  }

  private async searchInParentDirectories(filePath: string, basePath: string): Promise<string> {
    const fileSearchService = FileSearchService.Instance();
    let currentBasePath = basePath;

    while (true) {
      // 親ディレクトリを取得
      const parentResult = await fileSearchService.findParent(currentBasePath);
      if (parentResult.error) {
        throw new Error(`ファイルが見つかりません: ${filePath}`);
      }

      if (!parentResult.path) {
        throw new Error(
          `予期せぬエラー: 親ディレクトリのパスが取得できませんでした - ${currentBasePath}`
        );
      }

      // 親ディレクトリでファイル検索
      currentBasePath = parentResult.path;
      const result = await fileSearchService.findFileInBase(filePath, currentBasePath);

      if (!result.error && result.path) {
        return result.path;
      }
    }
  }
}
