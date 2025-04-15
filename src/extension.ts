import * as vscode from 'vscode';
import { InlinedCopyService } from './services/InlinedCopyService';
import { VSCodeWrapper } from './utils/VSCodeWrapper';

export function activate(context: vscode.ExtensionContext): void {
  // LogWrapperはインスタンス作成時に既に初期化されている
  // コンテキストに登録する必要があるディスポーザブルはここで登録

  const disposable = vscode.commands.registerCommand('inlined-copy.copyInline', () =>
    InlinedCopyService.Instance().executeCommand()
  );

  context.subscriptions.push(disposable);
}

export function deactivate(): void {
  VSCodeWrapper.Instance().dispose();
}
