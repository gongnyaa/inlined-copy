import * as vscode from 'vscode';
import * as path from 'path';
import { FileExpander } from './fileExpander';
import { ParameterProcessor } from './parameterProcessor';
import { VSCodeEnvironment } from './utils/vscodeEnvironment';
import { LogManager } from './utils/logManager';

/**
 * Activates the extension
 * @param context The extension context
 */
export function activate(context: vscode.ExtensionContext): void {
  // Initialize LogManager
  LogManager.initialize(context);
  LogManager.info('inlined Copy extension is now active');

  // Register the copyInline command
  const disposable = vscode.commands.registerCommand('inlined-copy.copyInline', async () => {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        LogManager.warn('No active editor found', true);
        return;
      }

      // Get the selected text or entire document if no selection
      const selection = editor.selection;
      const text = selection.isEmpty 
        ? editor.document.getText() 
        : editor.document.getText(selection);

      if (!text) {
        LogManager.warn('No text to process', true);
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
      LogManager.info('Text copied to clipboard with expanded references and parameters', true);
    } catch (error) {
      LogManager.error(`Error: ${error instanceof Error ? error.message : String(error)}`, true);
    }
  });

  context.subscriptions.push(disposable);

  // Set up FileSystemWatcher to invalidate cache when files change
  // Get configuration for file types to watch
  const config = VSCodeEnvironment.getConfiguration('inlined-copy', 'watchFileTypes', ['**/*.md']);
  
  // Create a file change handler that clears both caches
  const fileChangeHandler = () => {
    // Clear the FileResolver cache when files change
    // Import FileResolver dynamically to avoid circular dependencies
    import('./fileResolver/fileResolver').then(module => {
      module.FileResolver.clearCache();
      LogManager.debug('FileResolver cache cleared due to file system changes');
    });
    
    // Clear the FileExpander cache as well
    import('./fileExpander').then(module => {
      module.FileExpander.clearCache();
      LogManager.debug('FileExpander cache cleared due to file system changes');
    });
  };
  
  // Create watchers for each pattern
  const watchers: vscode.FileSystemWatcher[] = [];
  
  // Create a watcher for each pattern
  config.forEach(pattern => {
    const watcher = VSCodeEnvironment.createFileSystemWatcher(pattern);
    watcher.onDidChange(fileChangeHandler);
    watcher.onDidCreate(fileChangeHandler);
    watcher.onDidDelete(fileChangeHandler);
    watchers.push(watcher);
    context.subscriptions.push(watcher);
  });
  
  // Log the watched patterns
  LogManager.debug(`Watching file patterns: ${config.join(', ')}`);
}

/**
 * Deactivates the extension
 */
export function deactivate(): void {
  // Clean up resources if needed
  LogManager.dispose();
  LogManager.debug('inlined Copy extension is now deactivated');
}
