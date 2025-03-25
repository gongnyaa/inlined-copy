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
 * 対象となる元テキストが見つからない場合にスローされる例外
 */
export class TextNotFoundException extends Error {
  constructor(message: string = '対象となる元テキストが見つかりません') {
    super(message);
    this.name = 'TextNotFoundException';
    // Error クラスの prototype チェーンを正しく設定
    Object.setPrototypeOf(this, TextNotFoundException.prototype);
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
