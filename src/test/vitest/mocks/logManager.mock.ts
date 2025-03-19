import { vi } from 'vitest';

/**
 * Options for LogManager mock configuration
 */
interface LogManagerMockOptions {
  logLevel?: number;
  debugMode?: boolean;
}

/**
 * Creates a configured LogManager mock
 * @param options Configuration options for the mock
 * @returns A configured LogManager mock object
 */
export function createLogManagerMock(options: LogManagerMockOptions = {}): Record<string, any> {
  const defaultOptions = {
    logLevel: 0, // LogLevel.NONE
    debugMode: false,
    ...options,
  };

  return {
    initialize: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    dispose: vi.fn(),
    getLogLevel: vi.fn().mockReturnValue(defaultOptions.logLevel),
    isDebugMode: vi.fn().mockReturnValue(defaultOptions.debugMode),
    setLogLevel: vi.fn(),
  };
}

// Export default mock instance for backward compatibility
export const mockLogManager = createLogManagerMock();

/**
 * Resets all mock functions in the LogManager mock
 */
export const resetMockLogManager = (): void => {
  vi.clearAllMocks();
};
