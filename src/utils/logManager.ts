import * as vscode from 'vscode';

/**
 * Simplified logging manager for the extension
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
   * Simple log method
   * @param message The message to log
   */
  public static log(message: string): void {
    console.log(`[Inlined Copy] ${message}`);
  }
  
  /**
   * Error log method
   * @param message The error message to log
   */
  public static error(message: string): void {
    console.error(`[Inlined Copy] ERROR: ${message}`);
  }
  
  /**
   * Disposes of the LogManager resources
   */
  public static dispose(): void {
    this.outputChannel?.dispose();
    this.outputChannel = undefined;
  }
}
