import { MessageKey } from '../constants/messages';
import { DEFAULT_MESSAGES } from '../constants/defaultMessages';

/**
 * パラメータ置換を行うインターフェース
 */
type TranslationParams = Record<string, string | number>;

/**
 * メッセージキーから対応するメッセージを取得する
 * 将来的にi18next等に置き換え可能な構造
 *
 * @param key メッセージキー
 * @param params 置換パラメータ
 * @returns 翻訳されたメッセージ
 */
export function t(key: MessageKey, params?: TranslationParams): string {
  let message = DEFAULT_MESSAGES[key] || key;

  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      message = message.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
    });
  }

  return message;
}
