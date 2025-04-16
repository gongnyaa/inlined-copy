import * as path from 'path';
import * as vscode from 'vscode';

export interface IVSCodeWrapper {
  appendLine(message: string, needShow: boolean): void;
  showInformationMessage(message: string): Thenable<string | undefined>;
  showErrorMessage(message: string): Thenable<string | undefined>;
  getConfiguration<T>(section: string, key: string, defaultValue: T): T;
  writeClipboard(text: string): Thenable<void>;
  getSelectionText(): { text: string | null; currentDir: string };
  getDocumentText(): { text: string | null; currentDir: string };
  dispose(): void;
}

export class VSCodeWrapper implements IVSCodeWrapper {
  private static _instance: IVSCodeWrapper;
  private _outputChannel: vscode.OutputChannel | undefined;

  constructor() {
    this._outputChannel = vscode.window.createOutputChannel('Inlined Copy');
  }

  public static Instance(): IVSCodeWrapper {
    if (!this._instance) {
      this._instance = new VSCodeWrapper();
    }
    return this._instance;
  }

  public static SetInstance(instance: IVSCodeWrapper): void {
    this._instance = instance;
  }

  public appendLine(message: string, needShow: boolean): void {
    this._outputChannel?.appendLine(message);
    if (needShow) this._outputChannel?.show();
  }

  public showInformationMessage(message: string): Thenable<string | undefined> {
    return vscode.window.showInformationMessage(message);
  }

  public showErrorMessage(message: string): Thenable<string | undefined> {
    return vscode.window.showErrorMessage(message);
  }

  public getConfiguration<T>(section: string, key: string, defaultValue: T): T {
    return vscode.workspace.getConfiguration(section).get<T>(key) ?? defaultValue;
  }

  public writeClipboard(text: string): Thenable<void> {
    return vscode.env.clipboard.writeText(text);
  }

  public getSelectionText(): { text: string | null; currentDir: string } {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return { text: null, currentDir: '' };
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      return { text: null, currentDir: '' };
    }

    const text = editor.document.getText(selection);
    const currentFilePath = editor.document.uri.fsPath;
    const currentDir = path.dirname(currentFilePath);
    return { text, currentDir };
  }

  public getDocumentText(): { text: string | null; currentDir: string } {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return { text: null, currentDir: '' };
    }

    const text = editor.document.getText();
    const currentFilePath = editor.document.uri.fsPath;
    const currentDir = path.dirname(currentFilePath);
    return { text, currentDir };
  }

  public dispose(): void {
    if (this._outputChannel) {
      this._outputChannel.dispose();
      this._outputChannel = undefined;
    }
  }
}
