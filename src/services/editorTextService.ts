import * as vscode from 'vscode';
import * as path from 'path';
import { LogManager } from '../utils/logManager';

/**
 * エディタからテキストを取得するためのインターフェース
 */
export interface IEditorTextService {
  /**
   * アクティブなエディタからテキストを取得する
   * @returns 取得したテキストと現在のディレクトリのパス、または取得できない場合はnull
   */
  getTextFromEditor(): Promise<{ text: string; currentDir: string } | null>;
}

/**
 * VS Code環境でエディタからテキストを取得するサービス
 */
export class EditorTextService implements IEditorTextService {
  /**
   * アクティブなエディタからテキストを取得する
   * @returns 取得したテキストと現在のディレクトリのパス、または取得できない場合はnull
   */
  public async getTextFromEditor(): Promise<{ text: string; currentDir: string } | null> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      LogManager.log('アクティブなエディタが見つかりません');
      return null;
    }

    // 選択されたテキストまたは選択がない場合は文書全体を取得
    const selection = editor.selection;
    const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);

    if (!text) {
      LogManager.log('処理するテキストがありません');
      return null;
    }

    // 相対パスを解決するために現在のファイルのディレクトリを取得
    const currentFilePath = editor.document.uri.fsPath;
    const currentDir = path.dirname(currentFilePath);

    LogManager.log('currentDir:' + currentDir);

    return { text, currentDir };
  }
}
