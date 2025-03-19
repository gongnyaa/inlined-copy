import { beforeEach, afterAll, vi } from 'vitest';
import { resetMockVSCodeEnvironment } from '../mocks/vscodeEnvironment.mock';
import { resetMockLogManager } from '../mocks/logManager.mock';
import { setupFileSystemMock } from '../mocks/fileSystem.mock';

/**
 * Options for standard test environment setup
 */
interface TestEnvironmentOptions {
  fileSystem?: Record<string, any>;
}

/**
 * Sets up a standard test environment with common mocks
 * @param options Configuration options for test environment
 * @returns Object containing mock instances and utilities
 */
export function setupStandardTestEnvironment(options: TestEnvironmentOptions = {}): {
  fileSystem: { restore: () => void } | null;
} {
  const mocks = {
    fileSystem: null as { restore: () => void } | null,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    resetMockVSCodeEnvironment();
    resetMockLogManager();

    mocks.fileSystem = setupFileSystemMock(options.fileSystem || {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
    mocks.fileSystem?.restore();
  });

  return mocks;
}
