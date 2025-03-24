import * as vscode from 'vscode';
import { LogManager } from './utils/logManager';
import { InlinedCopyService } from './services/inlinedCopyService';

/**
 * 拡張機能をアクティブ化する
 * @param context 拡張機能のコンテキスト
 */
export function activate(
  context: vscode.ExtensionContext,
  logManager = LogManager,
  service = InlinedCopyService
): void {
  // LogManagerを初期化
  logManager.initialize(context);

  // copyInlineコマンドを登録
  const disposable = vscode.commands.registerCommand(
    'inlined-copy.copyInline',
    service.executeCommand
  );

  context.subscriptions.push(disposable);
}

/**
 * 拡張機能を非アクティブ化する
 */
export function deactivate(logManager = LogManager): void {
  // 必要に応じてリソースをクリーンアップ
  logManager.dispose();
}
