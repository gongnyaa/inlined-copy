import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "inlined-copy" is now active!');

  let disposable = vscode.commands.registerCommand('inlined-copy.helloWorld', () => {
    vscode.window.showInformationMessage('Hello World from inlined Copy!');
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
