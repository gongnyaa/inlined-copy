/**
 * inlined-copy拡張機能の基本例外インターフェース
 */
export interface IInlinedCopyError {
  name: string;
  message: string;
}

/**
 * inlined-copy拡張機能の基本例外クラス
 */
export class InlinedCopyBaseError extends Error implements IInlinedCopyError {
  constructor(message: string) {
    super(message);
    this.name = 'InlinedCopyBaseError';
    Object.setPrototypeOf(this, InlinedCopyBaseError.prototype);
  }
}

/**
 * サイズ制限を超えるデータを処理しようとした時にスローされる例外
 */
export class LargeDataError extends InlinedCopyBaseError {
  constructor(message: string) {
    super(message);
    this.name = 'LargeDataError';
    Object.setPrototypeOf(this, LargeDataError.prototype);
  }
}

/**
 * 循環参照が検出された時にスローされる例外
 */
export class CircularReferenceError extends InlinedCopyBaseError {
  constructor(message: string) {
    super(message);
    this.name = 'CircularReferenceError';
    Object.setPrototypeOf(this, CircularReferenceError.prototype);
  }
}

/**
 * 対象となる元テキストが見つからない場合にスローされる例外
 */
export class TextNotFoundError extends InlinedCopyBaseError {
  constructor(message: string) {
    super(message);
    this.name = 'TextNotFoundError';
    Object.setPrototypeOf(this, TextNotFoundError.prototype);
  }
}

/**
 * ファイル検索エラーの種類
 */
export type FileSearchErrorType = 'NotFound' | 'OutsideWorkspace' | 'NoWorkspace';

/**
 * ファイル検索時に発生するエラー
 */
export class FileSearchError extends InlinedCopyBaseError {
  constructor(
    public readonly type: FileSearchErrorType,
    message: string
  ) {
    super(message);
    this.name = 'FileSearchError';
    Object.setPrototypeOf(this, FileSearchError.prototype);
  }
}
