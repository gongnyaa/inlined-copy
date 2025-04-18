import { MessageKey } from '../constants/Messages';
import { DEFAULT_MESSAGES } from '../constants/DefaultMessages';

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
export type TFunction = (key: MessageKey, params?: TranslationParams) => string;

let tImpl: TFunction = (key, params) => {
  let message = DEFAULT_MESSAGES[key] || key;
  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      message = message.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
    });
  }
  return message;
};

export function setT(fn: TFunction) {
  tImpl = fn;
}

export function t(key: MessageKey, params?: TranslationParams): string {
  return tImpl(key, params);
}
