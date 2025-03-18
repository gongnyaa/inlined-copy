import { vi } from 'vitest';

/**
 * Mock implementation of LogManager for testing
 */
export const mockLogManager = {
  initialize: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  dispose: vi.fn(),
  getLogLevel: vi.fn(),
  isDebugMode: vi.fn(),
};

/**
 * Resets all mock functions in the mockLogManager
 */
export const resetMockLogManager = (): void => {
  vi.clearAllMocks();
};
