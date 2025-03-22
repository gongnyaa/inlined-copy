import { vi } from 'vitest';
import { VSCodeEnvironmentMock } from './types';

/**
 * Options for VSCodeEnvironment mock configuration
 */
interface VSCodeEnvironmentMockOptions {
  maxFileSize?: number;
  maxRecursionDepth?: number;
}

/**
 * Creates a configured VSCodeEnvironment mock
 * @param options Configuration options for the mock
 * @returns A configured VSCodeEnvironment mock object
 */
export function createVSCodeEnvironmentMock(
  options: VSCodeEnvironmentMockOptions = {}
): VSCodeEnvironmentMock {
  const defaultOptions = {
    maxFileSize: 1024, // 1KB for testing
    maxRecursionDepth: 1, // Default for testing
    ...options,
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
      return defaultValue;
    }),
    writeClipboard: vi.fn(),
    createFileSystemWatcher: vi.fn(),
  };
}

// Export default mock instance for backward compatibility
export const mockVSCodeEnvironment = createVSCodeEnvironmentMock();

/**
 * Creates a standardized mock for VSCodeEnvironment
 * @returns Standard VSCodeEnvironment mock object for tests
 */
export function createStandardVSCodeEnvironmentMock(): {
  VSCodeEnvironment: VSCodeEnvironmentMock;
  vSCodeEnvironment: VSCodeEnvironmentMock;
} {
  return {
    VSCodeEnvironment: mockVSCodeEnvironment,
    vSCodeEnvironment: mockVSCodeEnvironment,
  };
}

/**
 * Resets all mock functions in the VSCodeEnvironment mock
 */
export const resetMockVSCodeEnvironment = (): void => {
  vi.clearAllMocks();
};
