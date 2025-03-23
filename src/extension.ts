import * as vscode from 'vscode';
import { VSCodeEnvironment } from './utils/vscodeEnvironment';
import { LogManager } from './utils/logManager';
import { InlinedCopyService } from './services/inlinedCopyService';

/**
 * Activates the extension
 * @param context The extension context
 */
export function activate(context: vscode.ExtensionContext): void {
  // Initialize LogManager
  LogManager.initialize(context);
  LogManager.log('inlined Copy extension is now active');

  // アクティベーション時にトースト通知を表示
  VSCodeEnvironment.showInformationMessage(
    'inlined Copy 拡張機能 Ver0.1.4がアクティブになりました'
  );

  const service = new InlinedCopyService();

  // Register the copyInline command
  const disposable = vscode.commands.registerCommand(
    'inlined-copy.copyInline',
    service.executeCommand.bind(service)
  );

  context.subscriptions.push(disposable);
}

/**
 * Deactivates the extension
 */
export function deactivate(): void {
  // Clean up resources if needed
  LogManager.dispose();
  LogManager.log('inlined Copy extension is now deactivated');
}
