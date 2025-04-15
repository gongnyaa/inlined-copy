import { MessageKey, MESSAGE_KEYS } from './messages';

/**
 * デフォルトの日本語メッセージ定義
 */
export const DEFAULT_MESSAGES: Record<MessageKey, string> = {
  [MESSAGE_KEYS.COPY_SUCCESS]: '展開された参照を含むテキストがクリップボードにコピーされました',
  [MESSAGE_KEYS.TEXT_NOT_FOUND]: 'コピー元のテキストが見つかりませんでした',
  [MESSAGE_KEYS.UNEXPECTED_ERROR]: '予期せぬエラー: {{message}}',
};
