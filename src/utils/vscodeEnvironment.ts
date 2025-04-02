import * as vscode from 'vscode';

export interface IVSCodeEnvironment {
  showInformationMessage(message: string): Thenable<string | undefined>;
  showErrorMessage(message: string): Thenable<string | undefined>;
  getConfiguration<T>(section: string, key: string, defaultValue: T): T;
  writeClipboard(text: string): Thenable<void>;
}

export class VSCodeEnvironment implements IVSCodeEnvironment {
  private static _instance: IVSCodeEnvironment;

  public static Instance(): IVSCodeEnvironment {
    if (!this._instance) {
      this._instance = new VSCodeEnvironment();
    }
    return this._instance;
  }

  public static SetInstance(instance: IVSCodeEnvironment): void {
    this._instance = instance;
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
}
