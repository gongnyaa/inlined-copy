import { describe, it, expect, vi, beforeEach } from 'vitest';
import { t } from './I18n';
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
});
