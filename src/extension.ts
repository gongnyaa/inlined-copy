import * as vscode from 'vscode';
import { VSCodeEnvironment } from './utils/vscodeEnvironment';
import { LogManager } from './utils/logManager';
import { InlinedCopyService } from './services/inlinedCopyService';

/**
 * 拡張機能をアクティブ化する
 * @param context 拡張機能のコンテキスト
 */
export function activate(context: vscode.ExtensionContext): void {
  // LogManagerを初期化
  LogManager.initialize(context);
  LogManager.log('inlined Copy extension is now active');

  // アクティベーション時にトースト通知を表示
  VSCodeEnvironment.showInformationMessage(
    'inlined Copy 拡張機能 Ver0.1.4がアクティブになりました'
  );

  const service = new InlinedCopyService();

  // copyInlineコマンドを登録
  const disposable = vscode.commands.registerCommand(
    'inlined-copy.copyInline',
    service.executeCommand.bind(service)
  );

  context.subscriptions.push(disposable);
}

/**
 * 拡張機能を非アクティブ化する
 */
export function deactivate(): void {
  // 必要に応じてリソースをクリーンアップ
  LogManager.dispose();
  LogManager.log('inlined Copy extension is now deactivated');
}
