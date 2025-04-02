import * as vscode from 'vscode';
import { IVSCodeEnvironment, VSCodeEnvironment } from './vscodeEnvironment';

export interface ILogWrapper {
  log(message: string): void;
  error(message: string): void;
  dispose(): void;
  notify(message: string): Thenable<string | undefined>;
  initialize(): void;
}

export class LogWrapper implements ILogWrapper {
  private static _instance: LogWrapper;
  private _outputChannel: vscode.OutputChannel | undefined;
  private _vscodeEnvironment: IVSCodeEnvironment;

  private constructor(skipInitialize: boolean = false) {
    this._vscodeEnvironment = VSCodeEnvironment.Instance();
    if (!skipInitialize) {
      this.initialize();
    }
  }

  public static Instance(): LogWrapper {
    if (!this._instance) {
      this._instance = new LogWrapper();
    }
    return this._instance as LogWrapper;
  }

  public static SetInstance(instance: LogWrapper): void {
    this._instance = instance;
  }

  /**
   * テスト用のファクトリメソッド
   * @param vscodeEnvironment テスト用のVSCodeEnvironmentモック
   * @returns テスト用のLogWrapperインスタンス
   */
  public static CreateForTest(vscodeEnvironment: IVSCodeEnvironment): LogWrapper {
    const instance = new LogWrapper(true); // 初期化をスキップ
    instance._vscodeEnvironment = vscodeEnvironment;
    return instance;
  }

  public initialize(): void {
    if (!this._outputChannel) {
      this._outputChannel = this._vscodeEnvironment.createOutputChannel('Inlined Copy');
      this._vscodeEnvironment.registerDisposable(this._outputChannel);
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
