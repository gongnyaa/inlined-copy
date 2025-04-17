import * as fs from 'fs';
import { FileResolverService } from './FileResolverService';
import { LogWrapper } from '../utils/LogWrapper';

/**
 * ファイル展開の結果型
 */
export type ExpandResult = { success: true; content: string } | { success: false; error: string };

/**
 * 成功したファイル展開結果を作成
 * @param content 展開されたコンテンツ
 * @returns 成功した展開結果
 */
export function expandSuccess(content: string): ExpandResult {
  return { success: true, content };
}

/**
 * 失敗したファイル展開結果を作成
 * @param error エラーメッセージ
 * @returns 失敗した展開結果
 */
export function expandFailure(error: string): ExpandResult {
  return { success: false, error };
}

/**
 * ファイル展開を行うサービスクラス
 */
export class FileExpanderService {
  private static _instance: FileExpanderService | null = null;

  /**
   * シングルトンインスタンスを取得
   */
  public static Instance(): FileExpanderService {
    if (!this._instance) {
      this._instance = new FileExpanderService();
    }
    return this._instance;
  }

  /**
   * テスト用にインスタンスを設定
   */
  public static SetInstance(instance: FileExpanderService | null): void {
    this._instance = instance;
  }

  /**
   * ファイルを展開する
   * @param text 展開対象のテキスト
   * @param currentDir 現在のディレクトリ
   * @returns 展開結果
   */
  public async expandFiles(text: string, currentDir: string): Promise<ExpandResult> {
    try {
      const fileRegex = /\[file:([^\]]+)\]/g;
      let match: RegExpExecArray | null;
      let result = text;

      while ((match = fileRegex.exec(text)) !== null) {
        const filePath = match[1].trim();
        try {
          const resolvedPath = await this.resolveFilePath(filePath, currentDir);
          const content = await this.readFile(resolvedPath);
          result = result.replace(match[0], content);
        } catch (error) {
          LogWrapper.Instance().warn(`ファイル展開エラー: ${error}`);
          result = result.replace(match[0], `[ファイルが見つかりません: ${filePath}]`);
        }
      }

      return expandSuccess(result);
    } catch (error) {
      LogWrapper.Instance().error(`展開処理エラー: ${error}`);
      return expandFailure(`エラー: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async resolveFilePath(filePath: string, basePath: string): Promise<string> {
    const result = await FileResolverService.Instance().resolveFilePath(filePath, basePath);

    if (!result.success) {
      await FileResolverService.Instance().getSuggestions(filePath);
      throw new Error(`ファイルが見つかりません: ${filePath}`);
    }

    return result.path;
  }

  private async readFile(filePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          reject(new Error(`ファイル読み込みエラー: ${err.message}`));
          return;
        }
        resolve(data);
      });
    });
  }
}
