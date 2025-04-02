import * as vscode from 'vscode';
import { IInlinedCopyService, InlinedCopyService } from './services/inlinedCopyService';
import { VSCodeWrapper } from './utils/vSCodeWrapper';

export function activate(
  context: vscode.ExtensionContext,
  inlinedCopyService: IInlinedCopyService = InlinedCopyService.Instance()
): void {
  // LogWrapperはインスタンス作成時に既に初期化されている
  // コンテキストに登録する必要があるディスポーザブルはここで登録

  const disposable = vscode.commands.registerCommand('inlined-copy.copyInline', () =>
    inlinedCopyService.executeCommand()
  );

  context.subscriptions.push(disposable);
}

export function deactivate(): void {
  VSCodeWrapper.Instance().dispose();
}
