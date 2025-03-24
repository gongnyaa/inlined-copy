// inlinedCopyService.ts

import * as vscode from 'vscode';
import * as path from 'path';
import { FileExpander } from '../fileExpander';
import { VSCodeEnvironment } from '../utils/vscodeEnvironment';
import { LogManager } from '../utils/logManager';

export class InlinedCopyService {
  public async executeCommand(): Promise<void> {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        LogManager.log('アクティブなエディタが見つかりません');
        return;
      }

      // 選択されたテキストまたは選択がない場合は文書全体を取得
      const selection = editor.selection;
      const text = selection.isEmpty
        ? editor.document.getText()
        : editor.document.getText(selection);

      if (!text) {
        LogManager.log('処理するテキストがありません');
        return;
      }

      // 相対パスを解決するために現在のファイルのディレクトリを取得
      const currentFilePath = editor.document.uri.fsPath;
      const currentDir = path.dirname(currentFilePath);

      // テキストを処理 - ファイル参照を展開
      const processedText = await FileExpander.expandFileReferences(text, currentDir);

      // 処理されたテキストをクリップボードにコピー
      await VSCodeEnvironment.writeClipboard(processedText);
      LogManager.log('展開された参照を含むテキストがクリップボードにコピーされました');
    } catch (error) {
      LogManager.error(`エラー: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
