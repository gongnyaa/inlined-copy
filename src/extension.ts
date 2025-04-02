import * as vscode from 'vscode';
import { ILogManager, LogManager } from './utils/logManager';
import { IInlinedCopyService, InlinedCopyService } from './services/inlinedCopyService';

export function activate(
  context: vscode.ExtensionContext,
  logManager: ILogManager = LogManager.Instance(),
  inlinedCopyService: IInlinedCopyService = InlinedCopyService.Instance()
): void {
  logManager.initialize(context);

  const disposable = vscode.commands.registerCommand('inlined-copy.copyInline', () =>
    inlinedCopyService.executeCommand()
  );

  context.subscriptions.push(disposable);
}

export function deactivate(logManager: ILogManager = LogManager.Instance()): void {
  logManager.dispose();
}
