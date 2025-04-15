import { ILogWrapper } from './logWrapper';
import { vi } from 'vitest';

export const mockLogWrapper: ILogWrapper = {
  log: vi.fn(),
  error: vi.fn(),
  notify: vi.fn().mockResolvedValue('OK'),
};
