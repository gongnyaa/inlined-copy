import { vi } from 'vitest';

/**
 * Options for VSCodeEnvironment mock configuration
 */
interface VSCodeEnvironmentMockOptions {
  maxFileSize?: number;
  maxRecursionDepth?: number;
  maxParameterRecursionDepth?: number;
}

/**
 * Creates a configured VSCodeEnvironment mock
 */
export function createVSCodeEnvironmentMock(options: VSCodeEnvironmentMockOptions = {}) {
  const defaultOptions = {
    maxFileSize: 1024, // 1KB for testing
    maxRecursionDepth: 1, // Default for testing
    maxParameterRecursionDepth: 1, // Default for testing
    ...options
  };
  
  return {
    showInformationMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    getConfiguration: vi.fn().mockImplementation((section, key, defaultValue) => {
      if (section === 'inlined-copy' && key === 'maxFileSize') {
        return defaultOptions.maxFileSize;
      }
      if (section === 'inlined-copy' && key === 'maxRecursionDepth') {
        return defaultOptions.maxRecursionDepth;
      }
      if (section === 'inlined-copy' && key === 'maxParameterRecursionDepth') {
        return defaultOptions.maxParameterRecursionDepth;
      }
      return defaultValue;
    }),
    writeClipboard: vi.fn(),
    createFileSystemWatcher: vi.fn(),
  };
}

// Export default mock instance for backward compatibility
export const mockVSCodeEnvironment = createVSCodeEnvironmentMock();

/**
 * Resets all mock functions in the VSCodeEnvironment mock
 */
export const resetMockVSCodeEnvironment = (): void => {
  vi.clearAllMocks();
};
