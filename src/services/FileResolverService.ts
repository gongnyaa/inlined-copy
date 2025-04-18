import * as vscode from 'vscode';
import * as path from 'path';
import { LogWrapper } from '../utils/LogWrapper';
import { SingletonBase } from '../utils/SingletonBase';

/**
 * ファイル解決操作の結果型
 */
export type FileResult = { success: true; path: string } | { success: false; error: string };

/**
 * 成功したファイル結果を作成
 * @param path 解決されたファイルパス
 * @returns 成功したファイル結果
 */
export function fileSuccess(path: string): FileResult {
  return { success: true, path };
}

/**
 * 失敗したファイル結果を作成
 * @param error エラーメッセージ
 * @returns 失敗したファイル結果
 */
export function fileFailure(error: string): FileResult {
  return { success: false, error };
}

/**
 * ファイル解決のためのインターフェース
 */
export interface IFileResolver {
  resolveFilePath(filePath: string, basePath: string): Promise<FileResult>;
  getSuggestions(filePath: string): Promise<string[]>;
}

/**
 * ファイル解決を行うサービスクラス
 */
export class FileResolverService extends SingletonBase<IFileResolver> implements IFileResolver {
  /**
   * ファイルパスを解決する
   * @param filePath 解決するファイルパス
   * @param basePath 基準となるパス
   * @returns 解決結果
   */
  public async resolveFilePath(filePath: string, basePath: string): Promise<FileResult> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return fileFailure('ワークスペースが見つかりません');
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const parsedPath = path.parse(filePath);
      const hasExtension = parsedPath.ext !== '';

      const hasParentFolder = parsedPath.dir !== '';
      const parentFolder = hasParentFolder ? parsedPath.dir : '';

      const baseSearchPattern = hasExtension
        ? parsedPath.base // "fileName.ext"
        : `${parsedPath.name}.*`; // "fileName.*"

      let currentPath = basePath;

      while (currentPath.startsWith(workspaceRoot)) {
        const relativeBase = path.relative(workspaceRoot, currentPath);

        let searchPattern: string;

        if (hasParentFolder) {
          searchPattern = path.join(relativeBase, parentFolder, baseSearchPattern);
        } else {
          searchPattern = path.join(relativeBase, '**', baseSearchPattern);
        }

        const files = await vscode.workspace.findFiles(searchPattern, '**/node_modules/**', 10);

        if (files.length > 0) {
          if (hasParentFolder) {
            const matchingFiles = files.filter(file => {
              const relativeFilePath = path.relative(workspaceRoot, file.fsPath);
              const actualParentDir = path.dirname(relativeFilePath);
              const expectedParentDir = path.join(relativeBase, parentFolder);
              return actualParentDir === expectedParentDir;
            });

            if (matchingFiles.length > 0) {
              return fileSuccess(matchingFiles[0].fsPath);
            }
          } else {
            return fileSuccess(files[0].fsPath);
          }
        }

        const parentPath = path.dirname(currentPath);
        if (parentPath === currentPath) {
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

  /**
   * ファイルパスの候補を取得する
   * @param filePath ファイルパス
   * @returns 候補の配列
   */
  public async getSuggestions(filePath: string): Promise<string[]> {
    try {
      const fileName = path.parse(filePath).name;
      const searchPattern = `**/${fileName}.*`;

      const uris = await vscode.workspace.findFiles(searchPattern, '**/node_modules/**', 5);
      return uris.map(uri => vscode.workspace.asRelativePath(uri));
    } catch (error) {
      LogWrapper.Instance().error(`候補取得エラー: ${error}`);
      return [];
    }
  }
}
