import { MessageKey, MESSAGE_KEYS } from './Messages';

/**
 * デフォルトの日本語メッセージ定義
 */
export const DEFAULT_MESSAGES: Record<MessageKey, string> = {
  [MESSAGE_KEYS.COPY_SUCCESS]: '展開された参照を含むテキストがクリップボードにコピーされました',
  [MESSAGE_KEYS.TEXT_NOT_FOUND]: 'コピー元のテキストが見つかりませんでした',
  [MESSAGE_KEYS.UNEXPECTED_ERROR]: '予期せぬエラー: {{message}}',
  [MESSAGE_KEYS.LOG_PREFIX]: '[Inlined Copy]',
  [MESSAGE_KEYS.LOG_WARN_PREFIX]: 'WARN',
  [MESSAGE_KEYS.LOG_ERROR_PREFIX]: 'ERROR',
};
