// inlinedCopyService.ts

import * as vscode from 'vscode';
import * as path from 'path';
import { FileExpander } from '../fileExpander';
import { VSCodeEnvironment } from '../utils/vscodeEnvironment';
import { LogManager } from '../utils/logManager';

export class InlinedCopyService {
  public async executeCommand(): Promise<void> {
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
      const processedText = await FileExpander.expandFileReferences(text, currentDir);

      // Copy the processed text to clipboard
      await VSCodeEnvironment.writeClipboard(processedText);
      LogManager.info('Text copied to clipboard with expanded references', true);
    } catch (error) {
      LogManager.error(`Error: ${error instanceof Error ? error.message : String(error)}`, true);
    }
  }
}
