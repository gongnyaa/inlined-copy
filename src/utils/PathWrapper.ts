import * as path from 'path';
import { SingletonBase } from './SingletonBase';

/**
 * パス情報を表すクラス
 */
export class PathInfo {
  readonly hasExtension: boolean;
  readonly hasParentFolder: boolean;
  readonly parentFolder: string;
  readonly baseSearchPattern: string;

  constructor(filePath: string) {
    const parsedPath = path.posix.parse(filePath);
    this.hasExtension = parsedPath.ext !== '';
    this.hasParentFolder = parsedPath.dir !== '';
    this.parentFolder = this.hasParentFolder ? parsedPath.dir : '';
    this.baseSearchPattern = this.hasExtension ? parsedPath.base : `${parsedPath.name}.*`;
  }

  /**
   * 検索パターンを構築する
   */
  buildSearchPattern(relativeBase: string, wildcardPattern: string): string {
    if (this.hasParentFolder) {
      return path.posix.join(relativeBase, this.parentFolder, this.baseSearchPattern);
    }
    return path.posix.join(relativeBase, wildcardPattern, this.baseSearchPattern);
  }
}

/**
 * パス操作のためのラッパークラス
 */
export class PathWrapper extends SingletonBase<PathWrapper> {
  /**
   * パス情報オブジェクトを作成する
   */
  createPathInfo(filePath: string): PathInfo {
    return new PathInfo(filePath);
  }

  /**
   * パスの正規化を行う
   */
  normalize(pathStr: string): string {
    return path.posix.normalize(pathStr);
  }

  /**
   * 相対パスを取得する
   */
  relative(from: string, to: string): string {
    return path.posix.relative(from, to);
  }

  /**
   * ディレクトリ名を取得する
   */
  dirname(pathStr: string): string {
    const result = path.posix.dirname(pathStr);
    // ルートディレクトリの場合、空文字列ではなく"/"を返す
    return result === '' ? '/' : result;
  }

  /**
   * ファイル名を取得する
   */
  basename(pathStr: string): string {
    return path.posix.basename(pathStr);
  }

  /**
   * パスを結合する
   */
  join(...paths: string[]): string {
    return path.posix.join(...paths);
  }

  /**
   * パスが別のパスの中に含まれているか確認する
   */
  isPathInside(checkPath: string, basePath: string): boolean {
    const normalizedCheckPath = this.normalize(checkPath);
    const normalizedBasePath = this.normalize(basePath);
    return normalizedCheckPath.startsWith(normalizedBasePath);
  }

  /**
   * ファイル検索パターンを生成する
   */
  createSearchPattern(
    relativeBase: string,
    fileName: string,
    wildcardPattern: string = '**'
  ): string {
    const pathInfo = this.createPathInfo(fileName);
    return pathInfo.buildSearchPattern(relativeBase, wildcardPattern);
  }

  /**
   * ファイルリストから条件に一致するファイルをフィルタリングする
   */
  filterMatchingFile(files: string[], pathInfo: PathInfo): string | null {
    if (files.length === 0) return null;
    if (!pathInfo.hasParentFolder) return files[0];

    // 親フォルダが指定されている場合は、そのフォルダにあるファイルのみを対象とする
    const matchingFile = files.find(file => {
      const fileDir = this.dirname(file);
      return fileDir.endsWith(pathInfo.parentFolder);
    });

    return matchingFile || null;
  }

  /**
   * ワークスペース内のファイルを検索する
   * @param workspaceRoot ワークスペースのルートパス
   * @param basePath 検索の基準となるパス
   * @param filePath 検索するファイルのパス
   * @param excludePattern 除外するパターン
   * @param maxResults 最大結果数
   * @param wildcardPattern ワイルドカードパターン
   * @returns 検索結果のファイルパス、見つからない場合はnull
   */
  async findFileInWorkspace(
    workspaceRoot: string,
    basePath: string,
    filePath: string,
    excludePattern: string | null,
    maxResults: number,
    wildcardPattern: string = '**'
  ): Promise<string | null> {
    const pathInfo = this.createPathInfo(filePath);
    const relativeBase = this.relative(workspaceRoot, basePath);

    // 検索パターンを構築
    const searchPattern = this.createSearchPattern(relativeBase, filePath, wildcardPattern);

    // VSCodeWrapperを使用してファイルを検索
    const { VSCodeWrapper } = await import('./VSCodeWrapper');
    const files = await VSCodeWrapper.Instance().findFiles(
      searchPattern,
      excludePattern,
      maxResults
    );

    return this.filterMatchingFile(
      files.map(file => file.fsPath),
      pathInfo
    );
  }
}
