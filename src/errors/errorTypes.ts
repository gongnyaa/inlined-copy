/**
 * inlined-copy拡張機能の基本例外クラス
 */
export class InlinedCopyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InlinedCopyError';
    Object.setPrototypeOf(this, InlinedCopyError.prototype);
  }
}

/**
 * サイズ制限を超えるデータを処理しようとした時にスローされる例外
 */
export class LargeDataException extends InlinedCopyError {
  constructor(message: string) {
    super(message);
    this.name = 'LargeDataException';
    Object.setPrototypeOf(this, LargeDataException.prototype);
  }
}

/**
 * 重複ファイル参照が検出された時にスローされる例外
 */
export class DuplicateReferenceException extends InlinedCopyError {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateReferenceException';
    Object.setPrototypeOf(this, DuplicateReferenceException.prototype);
  }
}

/**
 * 循環参照が検出された時にスローされる例外
 */
export class CircularReferenceException extends InlinedCopyError {
  constructor(message: string) {
    super(message);
    this.name = 'CircularReferenceException';
    Object.setPrototypeOf(this, CircularReferenceException.prototype);
  }
}

/**
 * 対象となる元テキストが見つからない場合にスローされる例外
 */
export class TextNotFoundException extends InlinedCopyError {
  constructor(message: string = '対象となる元テキストが見つかりません') {
    super(message);
    this.name = 'TextNotFoundException';
    Object.setPrototypeOf(this, TextNotFoundException.prototype);
  }
}

/**
 * ErrorオブジェクトをFileResult形式に変換する
 */
export function errorToFileResult(error: Error): import('../fileResolver/fileResult').FileResult {
  return { success: false, error: `${error.name}: ${error.message}` };
}
