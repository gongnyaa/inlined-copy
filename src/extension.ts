import * as vscode from 'vscode';
import * as path from 'path';
import { FileExpander } from './fileExpander';
import { ParameterProcessor } from './parameterProcessor';

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

      // Get the directory of the current file to resolve relative paths
      const currentFilePath = editor.document.uri.fsPath;
      const currentDir = path.dirname(currentFilePath);

      // Process the text - expand file references
      let processedText = await FileExpander.expandFileReferences(text, currentDir);
      
      // Process parameters
      processedText = await ParameterProcessor.processParameters(processedText);

      // Copy the processed text to clipboard
      await vscode.env.clipboard.writeText(processedText);
      vscode.window.showInformationMessage('Text copied to clipboard with expanded references and parameters');
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
