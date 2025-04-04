import * as vscode from 'vscode';
import { IInlinedCopyService, InlinedCopyService } from './services/inlinedCopyService';
import { VSCodeEnvironment } from './utils/vscodeEnvironment';

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
  VSCodeEnvironment.Instance().registerDisposable();
}
