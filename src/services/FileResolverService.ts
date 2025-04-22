import { SingletonBase } from '../utils';
import { FileSearchService } from './FileSearchService';

/**
 * ファイル解決のためのインターフェース
 */
export interface IFileResolver {
  /**
   * 指定ファイルのプロジェクト内のパスを取得する。
   * basePathを起点に、指定ファイルを探し、見つからない場合は親ディレクトリを辿って探す。
   * @param filePath 解決するファイルパス
   * @param basePath 基準となるパス
   * @returns 解決されたファイルパスの完全修飾パス
   * @throws Error ファイルが見つからない場合
   */
  getFilePathInProject(filePath: string, basePath: string): Promise<string>;
}

export class FileResolverService extends SingletonBase<IFileResolver> implements IFileResolver {
  public async getFilePathInProject(filePath: string, basePath: string): Promise<string> {
    let currentBasePath = basePath;

    while (FileSearchService.Instance().isInProject(currentBasePath)) {
      if (await FileSearchService.Instance().hasInBase(filePath, currentBasePath)) {
        return await FileSearchService.Instance().findFileInBase(filePath, currentBasePath);
      }
      currentBasePath = await FileSearchService.Instance().findParent(currentBasePath);
    }

    throw new Error(`ファイルが見つかりません: ${filePath}`);
  }
}
