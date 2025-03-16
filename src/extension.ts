import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Activates the extension
 * @param context The extension context
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('inlined Copy extension is now active');

  // Register the copyInline command
  let disposable = vscode.commands.registerCommand('inlined-copy.copyInline', async () => {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
      }

      // Get the selected text or entire document if no selection
      const selection = editor.selection;
      const text = selection.isEmpty 
        ? editor.document.getText() 
        : editor.document.getText(selection);

      if (!text) {
        vscode.window.showWarningMessage('No text to process');
        return;
      }

      // For now, just copy the text to clipboard
      // In future versions, we'll implement file expansion and parameter processing
      await vscode.env.clipboard.writeText(text);
      vscode.window.showInformationMessage('Text copied to clipboard');
    } catch (error) {
      vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  context.subscriptions.push(disposable);
}

/**
 * Deactivates the extension
 */
export function deactivate() {
  // Clean up resources if needed
}
