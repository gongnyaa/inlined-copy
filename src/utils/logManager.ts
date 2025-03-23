import * as vscode from 'vscode';
import { VSCodeEnvironment } from './vscodeEnvironment';
import { LogLevel, LOG_CONFIG } from './logTypes';

export class LogManager {
  private static outputChannel: vscode.OutputChannel | undefined;

  public static initialize(context: vscode.ExtensionContext): void {
    if (!this.outputChannel) {
      this.outputChannel = vscode.window.createOutputChannel('Inlined Copy');
      context.subscriptions.push(this.outputChannel);
    }
  }

  private static getLogLevel(): LogLevel {
    const level = VSCodeEnvironment.getConfiguration(
      LOG_CONFIG.SECTION,
      LOG_CONFIG.LOG_LEVEL,
      'info'
    ).toLowerCase();

    switch (level) {
      case 'none':
        return LogLevel.NONE;
      case 'error':
        return LogLevel.ERROR;
      case 'warn':
        return LogLevel.WARN;
      case 'debug':
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  private static isDebugMode(): boolean {
    return VSCodeEnvironment.getConfiguration(LOG_CONFIG.SECTION, LOG_CONFIG.DEBUG_MODE, false);
  }

  public static debug(message: string): void {
    if (this.getLogLevel() >= LogLevel.DEBUG) {
      this.outputChannel?.appendLine(`[DEBUG] ${message}`);
    }
  }

  public static info(message: string, showToUser = false): Thenable<string | undefined> | void {
    if (this.getLogLevel() >= LogLevel.INFO) {
      this.outputChannel?.appendLine(`[INFO] ${message}`);
      if (showToUser || this.isDebugMode()) {
        return VSCodeEnvironment.showInformationMessage(message);
      }
    }
  }

  public static warn(message: string, showToUser = true): Thenable<string | undefined> | void {
    if (this.getLogLevel() >= LogLevel.WARN) {
      this.outputChannel?.appendLine(`[WARN] ${message}`);
      if (showToUser || this.isDebugMode()) {
        return VSCodeEnvironment.showWarningMessage(message);
      }
    }
  }

  public static error(message: string, showToUser = true): Thenable<string | undefined> | void {
    if (this.getLogLevel() >= LogLevel.ERROR) {
      this.outputChannel?.appendLine(`[ERROR] ${message}`);
      if (showToUser || this.isDebugMode()) {
        return VSCodeEnvironment.showErrorMessage(message);
      }
    }
  }

  public static dispose(): void {
    this.outputChannel?.dispose();
    this.outputChannel = undefined;
  }
}
