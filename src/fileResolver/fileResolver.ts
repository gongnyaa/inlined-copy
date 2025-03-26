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

      // 親フォルダが指定されているか確認
      const hasParentFolder = parsedPath.dir !== '';
      const parentFolder = hasParentFolder ? parsedPath.dir : '';

      // 検索パターンの基本部分を準備
      const baseSearchPattern = hasExtension ? parsedPath.base : `${parsedPath.name}.*`;

      // basePath からワークスペースルートまでの相対パス
      let currentPath = basePath;
      while (currentPath.startsWith(workspaceRoot)) {
        const relativeBase = path.relative(workspaceRoot, currentPath);

        // 親フォルダが指定されている場合、それを検索パターンに含める
        let searchPattern;
        if (hasParentFolder) {
          // 親フォルダパスを含む検索パターンを作成
          searchPattern = path.join(relativeBase, parentFolder, baseSearchPattern);
        } else {
          // 親フォルダなしの場合は直下のファイルのみ検索
          searchPattern = path.join(relativeBase, baseSearchPattern);
        }

        const files = await vscode.workspace.findFiles(`**/${searchPattern}`, '/node_modules/', 10);

        if (files.length > 0) {
          // ファイルが見つかった場合、親フォルダの一致を確認
          if (hasParentFolder) {
            // 見つかったファイルのうち、親フォルダが一致するものをフィルタリング
            const matchingFiles = files.filter(file => {
              const fileDir = path.dirname(path.relative(workspaceRoot, file.fsPath));
              return fileDir.endsWith(parentFolder);
            });

            if (matchingFiles.length > 0) {
              return fileSuccess(matchingFiles[0].fsPath);
            }
          } else {
            // 親フォルダが指定されていない場合は最初のファイルを返す
            return fileSuccess(files[0].fsPath);
          }
        }

        // 親ディレクトリに移動
        const parentPath = path.dirname(currentPath);
        // 親ディレクトリが現在のパスと同じ場合（ルートに到達）は終了
        if (parentPath === currentPath) {
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
      const searchPattern = `**/${fileName}.*`;

      const uris = await vscode.workspace.findFiles(searchPattern, '**/node_modules/**', 5);
      return uris.map(uri => vscode.workspace.asRelativePath(uri));
    } catch (error) {
      LogManager.error(`候補取得エラー: ${error}`);
      return [];
    }
  }
}
