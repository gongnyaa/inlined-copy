import * as vscode from 'vscode';
import * as path from 'path';
import { TextNotFoundException } from '../errors/ErrorTypes';

export interface IEditorTextService {
  /**
   * アクティブなエディタからテキストを取得する
   * @returns 取得したテキストと現在のディレクトリのパス
   * @throws TextNotFoundException テキストが見つからない場合にスローされる
   */
  getTextFromEditor(): Promise<{ text: string; currentDir: string }>;
}

export class EditorTextService implements IEditorTextService {
  private static _instance: IEditorTextService;

  public static Instance(): IEditorTextService {
    if (!this._instance) {
      this._instance = new EditorTextService();
    }
    return this._instance;
  }
  public static SetInstance(instance: IEditorTextService): void {
    this._instance = instance;
  }

  public async getTextFromEditor(): Promise<{ text: string; currentDir: string }> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      throw new TextNotFoundException('アクティブなエディタが見つかりません');
    }

    // 選択されたテキストまたは選択がない場合は文書全体を取得
    const selection = editor.selection;
    const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);

    if (!text) {
      throw new TextNotFoundException('コピーするするテキストがありません');
    }

    // 相対パスを解決するために現在のファイルのディレクトリを取得
    const currentFilePath = editor.document.uri.fsPath;
    const currentDir = path.dirname(currentFilePath);

    return { text, currentDir };
  }
}
