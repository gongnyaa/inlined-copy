import { describe, it, expect, vi, beforeEach } from 'vitest';
import { t, setT } from './I18n';
import { MESSAGE_KEYS } from '../constants/Messages';
import { DEFAULT_MESSAGES } from '../constants/DefaultMessages';

describe('I18n', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('t_Happy', () => {
    const result = t(MESSAGE_KEYS.COPY_SUCCESS);

    expect(result).toBe(DEFAULT_MESSAGES[MESSAGE_KEYS.COPY_SUCCESS]);
  });

  it('t_Happy_WithParams', () => {
    const params = {
      message: 'テストエラー',
    };
    const result = t(MESSAGE_KEYS.UNEXPECTED_ERROR, params);

    expect(result).toBe('予期せぬエラー: テストエラー');
  });

  it('t_Happy_WithMultipleParams', () => {
    const testKey = 'test.key';
    const testMessage = 'テスト{{param1}}メッセージ{{param2}}';
    const originalMessages = { ...DEFAULT_MESSAGES };
    (DEFAULT_MESSAGES as any)[testKey] = testMessage;

    const params = {
      param1: '値1',
      param2: '値2',
    };
    const result = t(testKey as any, params);

    expect(result).toBe('テスト値1メッセージ値2');

    Object.assign(DEFAULT_MESSAGES, originalMessages);
  });

  it('t_Happy_FallbackToKey', () => {
    const nonExistentKey = 'non.existent.key';
    const result = t(nonExistentKey as any);

    expect(result).toBe(nonExistentKey);
  });

  it('setT_Happy_CustomImplementation', () => {
    // オリジナルのt実装を保存
    const originalT = t;

    // カスタム翻訳関数の実装
    const customT = vi.fn().mockImplementation(key => `カスタム: ${key}`);

    // setT関数でカスタム実装を設定
    setT(customT);

    // 結果の確認
    const result = t(MESSAGE_KEYS.COPY_SUCCESS);
    expect(result).toBe(`カスタム: ${MESSAGE_KEYS.COPY_SUCCESS}`);
    expect(customT).toHaveBeenCalledWith(MESSAGE_KEYS.COPY_SUCCESS, undefined);

    // テスト後にオリジナルの実装を復元するための設定
    // 注：originalTはただの関数なので、直接使うことはできないため
    // デフォルトの実装と同じロジックを持つ新しい関数を作成
    setT((key, params) => {
      let message = DEFAULT_MESSAGES[key] || key;
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          message = message.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
        });
      }
      return message;
    });

    // 復元できたかの確認
    const restoredResult = t(MESSAGE_KEYS.COPY_SUCCESS);
    expect(restoredResult).toBe(DEFAULT_MESSAGES[MESSAGE_KEYS.COPY_SUCCESS]);
  });
});
