import { vi } from 'vitest';

export const mockVSCodeEnvironment = {
  showInformationMessage: vi.fn(),
  showWarningMessage: vi.fn(),
  showErrorMessage: vi.fn(),
  getConfiguration: vi.fn().mockImplementation((section, key, defaultValue) => {
    if (section === 'inlined-copy' && key === 'maxFileSize') return 1024; // 1KB for testing
    if (section === 'inlined-copy' && key === 'maxRecursionDepth') return 1; // Default for testing
    return defaultValue;
  }),
  writeClipboard: vi.fn(),
  createFileSystemWatcher: vi.fn()
};

export const resetMockVSCodeEnvironment = () => {
  vi.clearAllMocks();
};
