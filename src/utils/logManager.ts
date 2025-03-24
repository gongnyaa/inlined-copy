import * as vscode from 'vscode';

/**
 * 拡張機能用の簡略化されたログマネージャー
 */
export class LogManager {
  private static outputChannel: vscode.OutputChannel | undefined;
  
  /**
   * LogManagerを初期化する
   * @param context 拡張機能のコンテキスト
   */
  public static initialize(context: vscode.ExtensionContext): void {
    // 出力チャンネルが存在しない場合は作成
    if (!this.outputChannel) {
      this.outputChannel = vscode.window.createOutputChannel('Inlined Copy');
      context.subscriptions.push(this.outputChannel);
    }
  }
  
  /**
   * シンプルなログメソッド
   * @param message ログに記録するメッセージ
   */
  public static log(message: string): void {
    console.log(`[Inlined Copy] ${message}`);
  }
  
  /**
   * エラーログメソッド
   * @param message ログに記録するエラーメッセージ
   */
  public static error(message: string): void {
    console.error(`[Inlined Copy] ERROR: ${message}`);
  }
  
  /**
   * LogManagerのリソースを破棄する
   */
  public static dispose(): void {
    this.outputChannel?.dispose();
    this.outputChannel = undefined;
  }
}
