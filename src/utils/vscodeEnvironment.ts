/**
 * テスト容易性のためのVS Code API呼び出しラッパークラス
 */
import * as vscode from 'vscode';

export class VSCodeEnvironment {
  /**
   * ユーザーに情報メッセージを表示する
   * @param message 表示するメッセージ
   * @returns メッセージが表示されたときに解決するプロミス
   */
  public static showInformationMessage(message: string): Thenable<string | undefined> {
    return vscode.window.showInformationMessage(message);
  }

  /**
   * ユーザーに警告メッセージを表示する
   * @param message 表示するメッセージ
   * @returns メッセージが表示されたときに解決するプロミス
   */
  public static showWarningMessage(message: string): Thenable<string | undefined> {
    return vscode.window.showWarningMessage(message);
  }

  /**
   * ユーザーにエラーメッセージを表示する
   * @param message 表示するメッセージ
   * @returns メッセージが表示されたときに解決するプロミス
   */
  public static showErrorMessage(message: string): Thenable<string | undefined> {
    return vscode.window.showErrorMessage(message);
  }

  /**
   * 設定値を取得する
   * @param section 設定セクション
   * @param key 設定キー
   * @param defaultValue 設定が設定されていない場合のデフォルト値
   * @returns 設定値またはデフォルト値
   */
  public static getConfiguration<T>(section: string, key: string, defaultValue: T): T {
    return vscode.workspace.getConfiguration(section).get<T>(key) ?? defaultValue;
  }

  /**
   * テキストをクリップボードに書き込む
   * @param text 書き込むテキスト
   * @returns テキストが書き込まれたときに解決するプロミス
   */
  public static writeClipboard(text: string): Thenable<void> {
    return vscode.env.clipboard.writeText(text);
  }

  /**
   * ファイルシステムウォッチャーを作成する
   * @param globPattern 監視するグロブパターン
   * @returns ファイルシステムウォッチャー
   */
  public static createFileSystemWatcher(globPattern: string): vscode.FileSystemWatcher {
    return vscode.workspace.createFileSystemWatcher(globPattern);
  }
}
