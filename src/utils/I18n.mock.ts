import { vi } from 'vitest';
import { MessageKey } from '../constants/Messages';

/**
 * I18n関数のモック
 */
export const mockT = vi
  .fn()
  .mockImplementation((key: MessageKey, _params?: Record<string, string | number>) => {
    return `Mocked translation for ${key}`;
  });
