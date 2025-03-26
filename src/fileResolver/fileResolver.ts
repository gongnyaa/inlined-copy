import * as vscode from 'vscode';
import * as path from 'path';
import { FileResult, fileSuccess, fileFailure } from './fileResult';
import { LogManager } from '../utils/logManager';

/**
 * ファイルパス解決クラス
 */
export class FileResolver {
  /**
   * ファイルパスを解決する
   */
  public static async resolveFilePath(filePath: string, basePath: string): Promise<FileResult> {
    try {
      // ワークスペースのルートフォルダを取得
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return fileFailure('ワークスペースが見つかりません');
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const parsedPath = path.parse(filePath);
      const hasExtension = parsedPath.ext !== '';

      // 親フォルダが指定されているか確認 (例: folderName/fileName → dir: "folderName", name: "fileName")
      const hasParentFolder = parsedPath.dir !== '';
      // 例: parentFolder = "folderName" または "folderName/subFolder" のように複数階層もあり得る
      const parentFolder = hasParentFolder ? parsedPath.dir : '';

      // 検索パターンの基本部分を準備
      // 例: 拡張子が無いなら "fileName.*", 拡張子があれば "fileName.ext"
      const baseSearchPattern = hasExtension
        ? parsedPath.base // 例: "fileName.ext"
        : `${parsedPath.name}.*`; // 例: "fileName.*"

      // basePath からワークスペースルートまでの相対パス
      let currentPath = basePath;
      while (currentPath.startsWith(workspaceRoot)) {
        const relativeBase = path.relative(workspaceRoot, currentPath);

        // 親フォルダが指定されているなら、それを検索パターンに含める
        // → 例: relativeBase + parentFolder + baseSearchPattern
        //    = "apps/myApp/src" + "folderName" + "fileName.*"
        let searchPattern: string;
        if (hasParentFolder) {
          searchPattern = path.join(relativeBase, parentFolder, baseSearchPattern);
        } else {
          // 親フォルダなしの場合は currentPath 配下の直下を検索
          searchPattern = path.join(relativeBase, baseSearchPattern);
        }

        // '**/' を付けないことで「searchPattern として与えたパス」に対してのみ検索
        // 第2引数は除外パターン (node_modules を除外)
        const files = await vscode.workspace.findFiles(searchPattern, '**/node_modules/**', 10);

        if (files.length > 0) {
          // 見つかったファイルの中から「本当に parentFolder が直下の親ディレクトリとして一致しているか」を確認
          if (hasParentFolder) {
            // 例: parentFolder = "folderName/subFolder" の場合は、そこがディレクトリパスとして丸ごと一致するか
            const matchingFiles = files.filter(file => {
              // ワークスペースルートからの相対パス (例: "apps/myApp/src/folderName/subFolder/fileName.js")
              const relativeFilePath = path.relative(workspaceRoot, file.fsPath);
              // そのファイルの直上ディレクトリ (例: "apps/myApp/src/folderName/subFolder")
              const actualParentDir = path.dirname(relativeFilePath);
              // 期待するディレクトリパス (例: "apps/myApp/src/folderName/subFolder")
              const expectedParentDir = path.join(relativeBase, parentFolder);

              // 丸ごと一致するかどうか
              return actualParentDir === expectedParentDir;
            });

            if (matchingFiles.length > 0) {
              // 最初にマッチしたものを返す (要件に応じて複数ヒット時の扱いを変更してください)
              return fileSuccess(matchingFiles[0].fsPath);
            }
          } else {
            // 親フォルダが指定されていない場合は、見つかったファイルをそのまま返す
            return fileSuccess(files[0].fsPath);
          }
        }

        // ファイルが見つからない場合、親ディレクトリに移動して再検索
        const parentPath = path.dirname(currentPath);
        if (parentPath === currentPath) {
          // ルートに到達した場合は終了
          break;
        }
        currentPath = parentPath;
      }

      return fileFailure(`ファイルが見つかりません: ${filePath}`);
    } catch (error) {
      LogManager.error(`ファイル解決エラー: ${error}`);
      return fileFailure(`エラー: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 代替のファイル候補を取得
   */
  public static async getSuggestions(filePath: string): Promise<string[]> {
    try {
      const fileName = path.parse(filePath).name;
      // こちらは単純に「ワークスペース全体から fileName.* を最大5件探す」例
      const searchPattern = `**/${fileName}.*`;

      const uris = await vscode.workspace.findFiles(searchPattern, '**/node_modules/**', 5);
      return uris.map(uri => vscode.workspace.asRelativePath(uri));
    } catch (error) {
      LogManager.error(`候補取得エラー: ${error}`);
      return [];
    }
  }
}
