import * as vscode from 'vscode';
import { IVSCodeEnvironment, VSCodeEnvironment } from './vscodeEnvironment';

export interface ILogManager {
  initialize(context: vscode.ExtensionContext): void;
  log(message: string): void;
  error(message: string): void;
  dispose(): void;
  notify(message: string): Thenable<string | undefined>;
}

export class LogManager implements ILogManager {
  private static _instance: ILogManager;
  private _outputChannel: vscode.OutputChannel | undefined;
  private _vscodeEnvironment: IVSCodeEnvironment;

  constructor(vscodeEnvironment: IVSCodeEnvironment = VSCodeEnvironment.Instance()) {
    this._vscodeEnvironment = vscodeEnvironment;
  }

  public static Instance(): ILogManager {
    if (!this._instance) {
      this._instance = new LogManager();
    }
    return this._instance;
  }

  public static SetInstance(instance: ILogManager): void {
    this._instance = instance;
  }

  public initialize(context: vscode.ExtensionContext): void {
    if (!this._outputChannel) {
      this._outputChannel = vscode.window.createOutputChannel('Inlined Copy');
      context.subscriptions.push(this._outputChannel);
      this._outputChannel?.appendLine(`[Inlined Copy] initialized`);
    }
  }

  public log(message: string): void {
    this._outputChannel?.appendLine(`[Inlined Copy] ${message}`);
  }

  public error(message: string): void {
    this._outputChannel?.appendLine(`[Inlined Copy] ERROR ${message}`);
    this._outputChannel?.show();
  }

  public dispose(): void {
    this.log('inlined Copy extension is now deactivated');
    this._outputChannel?.dispose();
    this._outputChannel = undefined;
  }

  public notify(message: string): Thenable<string | undefined> {
    return this._vscodeEnvironment.showInformationMessage(`[Inlined Copy] ${message}`);
  }
}
