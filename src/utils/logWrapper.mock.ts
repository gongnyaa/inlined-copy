import { LogWrapper } from './logWrapper';
import { vi } from 'vitest';

export const mockLogWrapper: LogWrapper = {
  log: vi.fn(),
  error: vi.fn(),
  notify: vi.fn().mockResolvedValue('OK'),
};
