import { ILogWrapper } from './LogWrapper';
import { vi } from 'vitest';

export const mockLogWrapper: ILogWrapper = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  notify: vi.fn().mockResolvedValue('OK'),
};
