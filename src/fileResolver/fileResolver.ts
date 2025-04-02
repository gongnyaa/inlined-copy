import * as vscode from 'vscode';
import * as path from 'path';
import { FileResult, fileSuccess, fileFailure } from './fileResult';
import { LogWrapper } from '../utils/logWrapper';

export class FileResolver {
  // シングルトンを使用するため、個別のセッターは不要
  // テスト時は LogWrapper.SetInstance() を使用
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

      // 例: filePath = "folderName/fileName.md"
      //   → parsedPath.dir = "folderName", parsedPath.name = "fileName", parsedPath.ext = ".md"
      // 例: filePath = "sub_in_folder.md"
      //   → parsedPath.dir = "", parsedPath.name = "sub_in_folder", parsedPath.ext = ".md"

      // 親フォルダが指定されているか確認
      const hasParentFolder = parsedPath.dir !== '';
      const parentFolder = hasParentFolder ? parsedPath.dir : '';

      // 検索パターンの基本部分を準備
      const baseSearchPattern = hasExtension
        ? parsedPath.base // "fileName.ext"
        : `${parsedPath.name}.*`; // "fileName.*"

      let currentPath = basePath;

      // basePath からワークスペースルートまで一つずつ上にたどる
      while (currentPath.startsWith(workspaceRoot)) {
        const relativeBase = path.relative(workspaceRoot, currentPath);

        let searchPattern: string;

        if (hasParentFolder) {
          // 親フォルダがある: "relativeBase/parentFolder/fileName.*" を検索
          // → 例: "apps/myApp/src/folderName/fileName.*"
          // "**/" は付けずに、階層を固定して検索
          searchPattern = path.join(relativeBase, parentFolder, baseSearchPattern);
        } else {
          // 親フォルダがない: "relativeBase/**/fileName.*" を検索
          // → 例: "apps/myApp/src/**/sub_in_folder.*"
          // これによって、relativeBase 配下のサブディレクトリも含めて探す
          searchPattern = path.join(relativeBase, '**', baseSearchPattern);
        }

        // node_modules などは除外
        const files = await vscode.workspace.findFiles(searchPattern, '**/node_modules/**', 10);

        if (files.length > 0) {
          if (hasParentFolder) {
            // 親フォルダ指定がある場合は「直上ディレクトリが parentFolder と完全一致」するものだけを返す
            // (複数階層の場合も含め、"relativeBase/parentFolder" と丸ごと一致させる)
            const matchingFiles = files.filter(file => {
              // ワークスペースルートからの相対パスにして比較
              const relativeFilePath = path.relative(workspaceRoot, file.fsPath);
              const actualParentDir = path.dirname(relativeFilePath);
              const expectedParentDir = path.join(relativeBase, parentFolder);
              return actualParentDir === expectedParentDir;
            });

            if (matchingFiles.length > 0) {
              return fileSuccess(matchingFiles[0].fsPath);
            }
          } else {
            // 親フォルダ指定がない場合はファイル名一致だけでOKなので、そのまま返す
            return fileSuccess(files[0].fsPath);
          }
        }

        // 見つからなければ一つ上のディレクトリへ
        const parentPath = path.dirname(currentPath);
        if (parentPath === currentPath) {
          // ルートに到達
          break;
        }
        currentPath = parentPath;
      }

      return fileFailure(`ファイルが見つかりません: ${filePath}`);
    } catch (error) {
      LogWrapper.Instance().error(`ファイル解決エラー: ${error}`);
      return fileFailure(`エラー: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public static async getSuggestions(filePath: string): Promise<string[]> {
    try {
      const fileName = path.parse(filePath).name;
      // 単純にワークスペース全体から fileName.* を拾う例
      const searchPattern = `**/${fileName}.*`;

      const uris = await vscode.workspace.findFiles(searchPattern, '**/node_modules/**', 5);
      return uris.map(uri => vscode.workspace.asRelativePath(uri));
    } catch (error) {
      LogWrapper.Instance().error(`候補取得エラー: ${error}`);
      return [];
    }
  }
}
