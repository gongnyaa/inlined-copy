/**
 * inlined-copy拡張機能のカスタムエラータイプ
 */

/**
 * サイズ制限を超えるデータを処理しようとした時にスローされる例外
 */
export class LargeDataException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LargeDataException';
  }
}

/**
 * 重複ファイル参照が検出された時にスローされる例外
 */
export class DuplicateReferenceException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateReferenceException';
  }
}

/**
 * 循環参照が検出された時にスローされる例外
 */
export class CircularReferenceException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircularReferenceException';
  }
}

/**
 * ErrorオブジェクトをFileResult形式に変換する
 * @param error 変換するエラー
 * @returns success=falseとエラーメッセージを含むFileResultオブジェクト
 */
export function errorToFileResult(error: Error): import('../fileResolver/fileResult').FileResult {
  return { success: false, error: `${error.name}: ${error.message}` };
}
