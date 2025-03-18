/**
 * Wrapper class for VS Code API calls to facilitate testing
 */
import * as vscode from 'vscode';

export class VSCodeEnvironment {
  /**
   * Shows an information message to the user
   * @param message The message to show
   * @returns A promise that resolves when the message is shown
   */
  public static showInformationMessage(message: string): Thenable<string | undefined> {
    return vscode.window.showInformationMessage(message);
  }

  /**
   * Shows a warning message to the user
   * @param message The message to show
   * @returns A promise that resolves when the message is shown
   */
  public static showWarningMessage(message: string): Thenable<string | undefined> {
    return vscode.window.showWarningMessage(message);
  }

  /**
   * Shows an error message to the user
   * @param message The message to show
   * @returns A promise that resolves when the message is shown
   */
  public static showErrorMessage(message: string): Thenable<string | undefined> {
    return vscode.window.showErrorMessage(message);
  }

  /**
   * Gets a configuration value
   * @param section The configuration section
   * @param key The configuration key
   * @param defaultValue The default value if the configuration is not set
   * @returns The configuration value or the default value
   */
  public static getConfiguration<T>(section: string, key: string, defaultValue: T): T {
    return vscode.workspace.getConfiguration(section).get<T>(key) ?? defaultValue;
  }

  /**
   * Writes text to the clipboard
   * @param text The text to write
   * @returns A promise that resolves when the text is written
   */
  public static writeClipboard(text: string): Thenable<void> {
    return vscode.env.clipboard.writeText(text);
  }

  /**
   * Creates a file system watcher
   * @param globPattern The glob pattern to watch
   * @returns A file system watcher
   */
  public static createFileSystemWatcher(globPattern: string): vscode.FileSystemWatcher {
    return vscode.workspace.createFileSystemWatcher(globPattern);
  }
}
