import * as vscode from 'vscode';
import { InlinedCopyService } from './services/InlinedCopyService';
import { VSCodeWrapper } from './utils';
import { COMMANDS } from './constants/Commands';

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(COMMANDS.COPY_INLINE, () =>
    InlinedCopyService.Instance().executeCommand()
  );

  context.subscriptions.push(disposable);
}

export function deactivate(): void {
  VSCodeWrapper.Instance().dispose();
}
