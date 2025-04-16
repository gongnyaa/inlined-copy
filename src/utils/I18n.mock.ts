import { vi } from 'vitest';
import { MessageKey, MESSAGE_KEYS } from '../constants/Messages';

/**
 * I18n関数のモック
 */
export const mockT = vi
  .fn()
  .mockImplementation((key: MessageKey, _params?: Record<string, string | number>) => {
    if (key === MESSAGE_KEYS.TEXT_NOT_FOUND) {
      return 'コピー元のテキストが見つかりませんでした';
    }
    return `Mocked translation for ${key}`;
  });
