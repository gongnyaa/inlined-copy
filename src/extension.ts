import * as vscode from 'vscode';
import { InlinedCopyService } from './services/InlinedCopyService';
import { VSCodeWrapper } from './utils/VSCodeWrapper';

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand('inlined-copy.copyInline', () =>
    InlinedCopyService.Instance().executeCommand()
  );

  context.subscriptions.push(disposable);
}

export function deactivate(): void {
  VSCodeWrapper.Instance().dispose();
}
