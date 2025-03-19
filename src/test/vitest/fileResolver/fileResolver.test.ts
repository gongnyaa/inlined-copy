import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockVSCodeEnvironment, resetMockVSCodeEnvironment } from '../mocks/vscodeEnvironment.mock';
import { mockLogManager, resetMockLogManager } from '../mocks/logManager.mock';
import * as fs from 'fs';
import * as path from 'path';
import { FileResolver } from '../../../fileResolver/fileResolver';

// Mock VSCodeEnvironment
vi.mock('../../../utils/vscodeEnvironment', () => ({
  VSCodeEnvironment: mockVSCodeEnvironment,
}));

// Mock LogManager
vi.mock('../../../utils/logManager', () => ({
  LogManager: mockLogManager,
}));

// Mock modules
vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

vi.mock('vscode', () => ({
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/workspace/root' } }],
    findFiles: vi.fn().mockResolvedValue([]),
    getConfiguration: () => ({
      get: () => 3,
    }),
  },
  window: {
    showErrorMessage: vi.fn(),
    showInformationMessage: vi.fn(),
  },
}));

// Simplified tests focusing on FileResolver's behavior
describe('FileResolver', () => {
  const mockBasePath = '/current/dir';

  beforeEach(() => {
    vi.resetAllMocks();
    resetMockVSCodeEnvironment();
    resetMockLogManager();
  });

  afterEach(() => {
    FileResolver.clearCache();
    vi.restoreAllMocks();
  });

  it('should resolve absolute paths directly', async () => {
    const absolutePath = '/current/dir/file.md';

    // Setup mock
    vi.mocked(fs.existsSync).mockReturnValueOnce(true);

    const result = await FileResolver.resolveFilePath(absolutePath, mockBasePath);

    expect(fs.existsSync).toHaveBeenCalledWith(absolutePath);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.path).toBe(absolutePath);
    }
  });

  it('should resolve relative paths directly', async () => {
    const relativePath = 'file.md';
    const absolutePath = path.resolve(mockBasePath, relativePath);

    // Setup mock
    vi.mocked(fs.existsSync).mockReturnValueOnce(true);

    const result = await FileResolver.resolveFilePath(relativePath, mockBasePath);

    expect(fs.existsSync).toHaveBeenCalledWith(absolutePath);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.path).toBe(absolutePath);
    }
  });

  it('should return failure when no file is found', async () => {
    const filename = 'nonexistent.md';

    // Make all resolutions fail
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = await FileResolver.resolveFilePath(filename, mockBasePath);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('File not found');
    }
  });
});
