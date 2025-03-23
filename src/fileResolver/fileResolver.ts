import * as vscode from 'vscode';
import * as path from 'path';
import { FileResult, fileSuccess, fileFailure } from './fileResult';
import { LogManager } from '../utils/logManager';

/**
 * シンプル化されたファイルパス解決クラス
 */
export class FileResolver {
  // よく使われる拡張子のリスト
  private static readonly DEFAULT_EXTENSIONS = [
    '.md',
    '.txt',
    '.js',
    '.ts',
    '.html',
    '.css',
    '.json',
  ];

  /**
   * ファイルパスを解決する
   */
  public static async resolveFilePath(filePath: string, basePath: string): Promise<FileResult> {
    try {
      // 拡張子の有無を確認
      const hasExtension = path.extname(filePath) !== '';
      LogManager.log('hasExtension:' + hasExtension + 'filePath:' + filePath);

      // ファイル名と親フォルダ（あれば）を抽出
      const parsedPath = path.parse(filePath);
      const dirPart = parsedPath.dir; // 例：hogehoge/sub の場合は hogehoge

      // 検索するためのファイル名とパターンを準備
      const fileNameWithoutExt = parsedPath.name;
      const fileExtension = parsedPath.ext;

      // 検索パターンを構築
      let searchPattern;

      // ディレクトリ部分を準備（存在する場合）
      let dirPattern = '';
      if (dirPart) {
        // 指定されたディレクトリ内のどこかにある場合
        dirPattern = `**/${dirPart}/**/`;
      } else {
        // 任意のディレクトリにある場合
        dirPattern = '**/';
      }

      // 検索結果を格納する配列
      let files: vscode.Uri[] = [];

      if (hasExtension) {
        // 拡張子指定あり - 完全一致させる
        searchPattern = `${dirPattern}${fileNameWithoutExt}${fileExtension}`;
        LogManager.log(`完全一致パターンで検索: ${searchPattern}`);

        // 完全一致で検索
        files = await vscode.workspace.findFiles(searchPattern, '**/node_modules/**', 10);

        // 完全一致するものが見つかった場合はそれを使用
        if (files.length > 0) {
          const bestMatch = await this.selectBestMatch(files, basePath, true);
          return fileSuccess(bestMatch.fsPath);
        }

        // 完全一致がなければ、拡張子なしで再検索
        LogManager.log(
          `${filePath}の完全一致が見つかりません。拡張子制限なしで再試行します`
        );
      }

      // 拡張子なしパターンで検索（拡張子指定がない場合、または完全一致が見つからなかった場合）
      searchPattern = `${dirPattern}${fileNameWithoutExt}.*`;
      LogManager.log(`ワイルドカードパターンで検索: ${searchPattern}`);

      // VSCodeのAPIでファイルを検索
      files = await vscode.workspace.findFiles(
        searchPattern,
        '**/node_modules/**', // 除外パターン
        10 // 最大結果数
      );

      LogManager.log(`${searchPattern}に一致するファイルが${files.length}個見つかりました`);

      if (files.length === 0) {
        return fileFailure(`ファイルが見つかりません: ${filePath}`);
      }

      try {
        // ファイルが見つかった場合は、最適なものを選択
        const bestMatch = await this.selectBestMatch(files, basePath, hasExtension);
        LogManager.log(`最適な一致を選択: ${bestMatch.fsPath}`);
        return fileSuccess(bestMatch.fsPath);
      } catch (error) {
        LogManager.error(`最適な一致の選択エラー: ${error}`);
        // テスト用に、ファイルが見つかった場合は最初のファイルを返す
        if (files.length > 0) {
          return fileSuccess(files[0].fsPath);
        }
        return fileFailure(
          `ファイル選択エラー: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } catch (error) {
      LogManager.error(`ファイル解決エラー: ${error}`);
      return fileFailure(`エラー: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 複数のマッチから最適なファイルを選択
   */
  private static async selectBestMatch(
    matches: vscode.Uri[],
    basePath: string,
    hasExtension: boolean
  ): Promise<vscode.Uri> {
    // デバッグログを追加
    LogManager.log(
      `selectBestMatch が呼び出されました: ${matches.length}件の一致、hasExtension: ${hasExtension}`
    );
    for (const match of matches) {
      LogManager.log(`  - 一致: ${match.fsPath}`);
    }

    if (matches.length === 1) {
      LogManager.log(`単一の一致が見つかりました。返却: ${matches[0].fsPath}`);
      return matches[0];
    }

    // 拡張子付きで検索した場合は、ファイル名が完全一致するものを優先
    if (hasExtension) {
      const requestedFileName = path.basename(matches[0].fsPath);
      LogManager.log(`拡張子付きの要求ファイル名: ${requestedFileName}`);

      const exactMatches = matches.filter(
        uri => path.basename(uri.fsPath).toLowerCase() === requestedFileName.toLowerCase()
      );

      if (exactMatches.length > 0) {
        // 完全一致するものがあれば、パスの短いものを優先
        const sortedByPathLength = [...exactMatches].sort((a, b) => {
          return a.fsPath.length - b.fsPath.length;
        });
        LogManager.log(
          `${exactMatches.length}件の完全一致が見つかりました。選択: ${sortedByPathLength[0].fsPath}`
        );
        return sortedByPathLength[0];
      }
    }

    // 拡張子なしで検索した場合、拡張子の優先順位でソート
    LogManager.log(`拡張子の優先順位で一致をソート`);

    const sortedByExtension = [...matches].sort((a, b) => {
      const extA = path.extname(a.fsPath).toLowerCase();
      const extB = path.extname(b.fsPath).toLowerCase();
      LogManager.log(`拡張子の比較: ${extA} vs ${extB}`);

      // デフォルト拡張子リストに基づき優先順位付け
      const indexA = this.DEFAULT_EXTENSIONS.indexOf(extA);
      const indexB = this.DEFAULT_EXTENSIONS.indexOf(extB);
      LogManager.log(`拡張子の優先順位: ${extA}=${indexA}, ${extB}=${indexB}`);

      // リストにある拡張子を優先
      if (indexA === -1 && indexB === -1) {
        return 0;
      }
      if (indexA === -1) {
        return 1;
      }
      if (indexB === -1) {
        return -1;
      }

      return indexA - indexB;
    });

    if (sortedByExtension.length > 0) {
      LogManager.log(`拡張子の優先順位でソート済み、最適な一致: ${sortedByExtension[0].fsPath}`);
      return sortedByExtension[0];
    }

    // マッチが見つからなかった場合はエラー
    throw new Error('一致するファイルが見つかりません');
  }

  /**
   * 代替のファイル候補を取得
   */
  public static async getSuggestions(filePath: string): Promise<string[]> {
    try {
      const parsedPath = path.parse(filePath);
      const fileNameWithoutExt = parsedPath.name;
      const searchPattern = `**/${fileNameWithoutExt}.*`;

      const uris = await vscode.workspace.findFiles(searchPattern, '**/node_modules/**', 5);

      return uris.map(uri => vscode.workspace.asRelativePath(uri));
    } catch (error) {
      LogManager.error(`候補取得エラー: ${error}`);
      return [];
    }
  }
}
