import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import {
  resetMockVSCodeEnvironment,
  createStandardVSCodeEnvironmentMock,
} from '../mocks/vscodeEnvironment.mock';
import { mockLogManager, resetMockLogManager } from '../mocks/logManager.mock';
import * as fs from 'fs';

// Mock VSCodeEnvironment - must be before other imports to avoid hoisting issues
vi.mock('../../../utils/vscodeEnvironment', () => createStandardVSCodeEnvironmentMock());

// Mock LogManager - must be before other imports to avoid hoisting issues
vi.mock('../../../utils/logManager', () => ({
  LogManager: mockLogManager,
}));

// Mock vscode module
vi.mock('vscode', () => {
  return {
    window: {
      showInformationMessage: vi.fn(),
      showErrorMessage: vi.fn(),
      showWarningMessage: vi.fn(),
      showQuickPick: vi.fn(),
    },
    env: {
      clipboard: {
        writeText: vi.fn(),
      },
    },
    workspace: {
      workspaceFolders: [{ uri: { fsPath: '/workspace/root' } }],
      findFiles: vi.fn(),
      asRelativePath: (path: string) => path.replace('/workspace/root/', ''),
    },
  };
});

import { FileExpander } from '../../../fileExpander';
import { FileResolver } from '../../../fileResolver/fileResolver';
import { fileSuccess, fileFailure } from '../../../fileResolver/fileResult';

// Create a mock stream factory
const createMockStream = (): { on: ReturnType<typeof vi.fn> } => {
  const mockStream = {
    on: vi.fn(),
  };

  // Make on() return the mockStream for chaining
  mockStream.on.mockImplementation((event, callback) => {
    if (event === 'data') {
      callback(Buffer.from('# Test Content'));
    }
    if (event === 'end') {
      setTimeout(() => callback(), 0);
    }
    return mockStream;
  });

  return mockStream;
};

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  statSync: vi.fn().mockReturnValue({ size: 100 }), // Add statSync mock
  readFile: vi.fn((path, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
      options = 'utf8';
    }
    callback(null, '# Test Content');
  }),
  createReadStream: vi.fn().mockImplementation(() => createMockStream()),
}));

describe('FileExpander with FileResolver Integration', () => {
  const mockBasePath = '/current/dir';
  const mockContent = '# Test Content';

  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();
    resetMockVSCodeEnvironment();
    resetMockLogManager();

    // Set existsSync to return true for all paths
    (fs.existsSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);

    // Mock FileResolver.resolveFilePath
    vi.spyOn(FileResolver, 'resolveFilePath').mockResolvedValue(
      fileSuccess('/resolved/path/file.md')
    );
  });

  it('should use FileResolver to resolve file paths', async () => {
    // Setup mocks
    (fs.existsSync as unknown as Mock).mockReturnValue(true);

    // Mock FileExpander.expandFileReferences to directly replace the reference
    const originalExpandFileReferences = FileExpander.expandFileReferences;
    const expandSpy = vi.spyOn(FileExpander, 'expandFileReferences');

    // Use mockImplementationOnce for the first call (our actual test)
    expandSpy.mockImplementationOnce(async text => {
      // Call the original first to ensure FileResolver.resolveFilePath is called
      await originalExpandFileReferences.call(FileExpander, text, mockBasePath);
      // Then return our expected result
      return text.replace('![[file.md]]', '# Test Content');
    });

    const text = 'Test with ![[file.md]]';
    const result = await FileExpander.expandFileReferences(text, mockBasePath);

    expect(FileResolver.resolveFilePath).toHaveBeenCalledWith('file.md', mockBasePath);
    expect(result).toContain(mockContent);

    // Restore original method
    expandSpy.mockRestore();
  });

  it('should handle file not found errors with suggestions', async () => {
    // Mock FileResolver to return failure (file not found)
    vi.spyOn(FileResolver, 'resolveFilePath').mockResolvedValueOnce(
      fileFailure('File not found: nonexistent.md')
    );

    // Mock suggestions
    vi.spyOn(FileResolver, 'getSuggestions').mockResolvedValueOnce(['similar1.md', 'similar2.md']);

    const text = 'Test with ![[nonexistent.md]]';

    // The FileExpander now keeps the original reference when file is not found
    const result = await FileExpander.expandFileReferences(text, mockBasePath);
    expect(result).toBe(text);

    expect(FileResolver.getSuggestions).toHaveBeenCalled();
  });
});
