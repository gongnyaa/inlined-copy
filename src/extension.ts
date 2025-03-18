import * as vscode from 'vscode';
import * as path from 'path';
import { FileExpander } from './fileExpander';
import { ParameterProcessor } from './parameterProcessor';
import { VSCodeEnvironment } from './utils/vscodeEnvironment';

/**
 * Activates the extension
 * @param context The extension context
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('inlined Copy extension is now active');

  // Register the copyInline command
  const disposable = vscode.commands.registerCommand('inlined-copy.copyInline', async () => {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        VSCodeEnvironment.showWarningMessage('No active editor found');
        return;
      }

      // Get the selected text or entire document if no selection
      const selection = editor.selection;
      const text = selection.isEmpty 
        ? editor.document.getText() 
        : editor.document.getText(selection);

      if (!text) {
        VSCodeEnvironment.showWarningMessage('No text to process');
        return;
      }

      // Get the directory of the current file to resolve relative paths
      const currentFilePath = editor.document.uri.fsPath;
      const currentDir = path.dirname(currentFilePath);

      // Process the text - expand file references
      let processedText = await FileExpander.expandFileReferences(text, currentDir);
      
      // Process parameters with initial depth 0
      processedText = await ParameterProcessor.processParameters(processedText, 0);

      // Copy the processed text to clipboard
      await VSCodeEnvironment.writeClipboard(processedText);
      VSCodeEnvironment.showInformationMessage('Text copied to clipboard with expanded references and parameters');
    } catch (error) {
      VSCodeEnvironment.showErrorMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  context.subscriptions.push(disposable);

  // Set up FileSystemWatcher to invalidate cache when files change
  const mdWatcher = VSCodeEnvironment.createFileSystemWatcher('**/*.md');
  const fileChangeHandler = () => {
    // Clear the file cache when files change
    // Import FileResolver dynamically to avoid circular dependencies
    import('./fileResolver/fileResolver').then(module => {
      module.FileResolver.clearCache();
    });
  };
  
  mdWatcher.onDidChange(fileChangeHandler);
  mdWatcher.onDidCreate(fileChangeHandler);
  mdWatcher.onDidDelete(fileChangeHandler);
  
  context.subscriptions.push(mdWatcher);
}

/**
 * Deactivates the extension
 */
export function deactivate(): void {
  // Clean up resources if needed
}
