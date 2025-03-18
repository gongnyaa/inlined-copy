import * as vscode from 'vscode';
import { VSCodeEnvironment } from './vscodeEnvironment';
import { LogLevel, LOG_CONFIG } from './logTypes';

/**
 * Centralized logging manager for the extension
 */
export class LogManager {
  private static outputChannel: vscode.OutputChannel | undefined;
  
  /**
   * Initializes the LogManager
   * @param context The extension context
   */
  public static initialize(context: vscode.ExtensionContext): void {
    // Create output channel if it doesn't exist
    if (!this.outputChannel) {
      this.outputChannel = vscode.window.createOutputChannel('Inlined Copy');
      context.subscriptions.push(this.outputChannel);
    }
  }
  
  /**
   * Gets the current log level from configuration
   * @returns The current log level
   */
  private static getLogLevel(): LogLevel {
    const logLevelString = VSCodeEnvironment.getConfiguration(
      LOG_CONFIG.SECTION, 
      LOG_CONFIG.LOG_LEVEL, 
      'info'
    );
    
    switch (logLevelString.toLowerCase()) {
      case 'none': return LogLevel.NONE;
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }
  
  /**
   * Checks if debug mode is enabled
   * @returns True if debug mode is enabled
   */
  private static isDebugMode(): boolean {
    return VSCodeEnvironment.getConfiguration(
      LOG_CONFIG.SECTION, 
      LOG_CONFIG.DEBUG_MODE, 
      false
    );
  }
  
  /**
   * Logs a debug message
   * @param message The message to log
   */
  public static debug(message: string): void {
    if (this.getLogLevel() >= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`);
      this.outputChannel?.appendLine(`[DEBUG] ${message}`);
    }
  }
  
  /**
   * Logs an info message
   * @param message The message to log
   * @param showToUser Whether to show the message to the user
   * @returns A promise that resolves when the message is shown (if applicable)
   */
  public static info(message: string, showToUser = false): Thenable<string | undefined> | void {
    if (this.getLogLevel() >= LogLevel.INFO) {
      console.log(`[INFO] ${message}`);
      this.outputChannel?.appendLine(`[INFO] ${message}`);
      
      if (showToUser || this.isDebugMode()) {
        return VSCodeEnvironment.showInformationMessage(message);
      }
    }
  }
  
  /**
   * Logs a warning message
   * @param message The message to log
   * @param showToUser Whether to show the message to the user
   * @returns A promise that resolves when the message is shown (if applicable)
   */
  public static warn(message: string, showToUser = true): Thenable<string | undefined> | void {
    if (this.getLogLevel() >= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`);
      this.outputChannel?.appendLine(`[WARN] ${message}`);
      
      if (showToUser || this.isDebugMode()) {
        return VSCodeEnvironment.showWarningMessage(message);
      }
    }
  }
  
  /**
   * Logs an error message
   * @param message The message to log
   * @param showToUser Whether to show the message to the user
   * @returns A promise that resolves when the message is shown (if applicable)
   */
  public static error(message: string, showToUser = true): Thenable<string | undefined> | void {
    if (this.getLogLevel() >= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`);
      this.outputChannel?.appendLine(`[ERROR] ${message}`);
      
      if (showToUser || this.isDebugMode()) {
        return VSCodeEnvironment.showErrorMessage(message);
      }
    }
  }
  
  /**
   * Disposes of the LogManager resources
   */
  public static dispose(): void {
    this.outputChannel?.dispose();
    this.outputChannel = undefined;
  }
}
