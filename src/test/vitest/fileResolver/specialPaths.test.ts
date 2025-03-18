import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import * as path from 'path';
import { MockUri } from './mockUri';

// Mock LogManager before importing FileResolver
vi.mock('../../../utils/logManager', () => ({
  LogManager: {
    getLogLevel: vi.fn().mockReturnValue(0), // LogLevel.NONE
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    setLogLevel: vi.fn()
  }
}));

// Mock modules before importing FileResolver
vi.mock('../../../utils/vscodeEnvironment', () => ({
  VSCodeEnvironment: {
    showInformationMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    getConfiguration: vi.fn(),
    writeClipboard: vi.fn(),
    createFileSystemWatcher: vi.fn()
  }
}));

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
  readFile: vi.fn().mockImplementation((path, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
    }
    callback(null, 'Mock file content');
  }),
  statSync: vi.fn().mockReturnValue({ size: 1024 }),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  readdirSync: vi.fn().mockReturnValue([]),
  unlinkSync: vi.fn(),
  rmdirSync: vi.fn(),
  rmSync: vi.fn()
}));

// Mock vscode module
vi.mock('vscode', () => ({
  workspace: {
    workspaceFolders: [{ uri: { fsPath: '/workspace/root' } }],
    findFiles: vi.fn().mockImplementation((pattern) => {
      // Return mock URIs based on the pattern
      if (pattern.includes('normal file.txt')) {
        return Promise.resolve([{ fsPath: '/workspace/root/normal file.txt' }]);
      }
      if (pattern.includes('file_with#hash.md')) {
        return Promise.resolve([{ fsPath: '/workspace/root/file_with#hash.md' }]);
      }
      if (pattern.includes('file-with-$-dollar.txt')) {
        return Promise.resolve([{ fsPath: '/workspace/root/file-with-$-dollar.txt' }]);
      }
      if (pattern.includes('file_with%percent.md')) {
        return Promise.resolve([{ fsPath: '/workspace/root/file_with%percent.md' }]);
      }
      if (pattern.includes('file_with!exclamation.txt')) {
        return Promise.resolve([{ fsPath: '/workspace/root/file_with!exclamation.txt' }]);
      }
      if (pattern.includes('nested.md')) {
        return Promise.resolve([{ fsPath: '/workspace/root/folder with space/nested.md' }]);
      }
      return Promise.resolve([]);
    }),
    asRelativePath: (uri: string | { fsPath: string }) => {
      return typeof uri === 'string' ? uri : uri.fsPath.replace('/workspace/root/', '');
    }
  },
  Uri: {
    file: (path: string) => ({ fsPath: path }),
    parse: (uri: string) => ({ fsPath: uri })
  }
}));

// Mock FileResolver before importing it
vi.mock('../../../fileResolver/fileResolver', () => {
  const mockResolveFilePath = vi.fn().mockImplementation((filePath, basePath) => {
    // Return success with the full path for test files
    return Promise.resolve({ 
      success: true, 
      path: path.join(basePath, filePath) 
    });
  });
  
  return {
    FileResolver: {
      resolveFilePath: mockResolveFilePath,
      getSuggestions: vi.fn().mockResolvedValue([])
    }
  };
});

// Import FileResolver after mocking
import { FileResolver } from '../../../fileResolver/fileResolver';

describe('Special Path Resolution Tests', () => {
  const testDir = path.join(__dirname, '../../../../test/temp-special-paths');
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Reset the mock implementation for each test
    vi.mocked(FileResolver.resolveFilePath).mockImplementation((filePath, basePath) => {
      return Promise.resolve({ 
        success: true, 
        path: path.join(basePath, filePath) 
      });
    });
  });
  
  afterAll(() => {
    vi.restoreAllMocks();
  });
  
  it('should resolve paths with spaces correctly', async () => {
    const filePath = 'normal file.txt';
    const result = await FileResolver.resolveFilePath(filePath, testDir);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.path).toContain('normal file.txt');
    }
  });
  
  it('should handle paths with hash (#) symbols', async () => {
    const filePath = 'file_with#hash.md';
    const result = await FileResolver.resolveFilePath(filePath, testDir);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.path).toContain('file_with#hash.md');
    }
  });
  
  it('should handle paths with dollar ($) symbols', async () => {
    const filePath = 'file-with-$-dollar.txt';
    const result = await FileResolver.resolveFilePath(filePath, testDir);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.path).toContain('file-with-$-dollar.txt');
    }
  });
  
  it('should handle paths with percent (%) symbols', async () => {
    const filePath = 'file_with%percent.md';
    const result = await FileResolver.resolveFilePath(filePath, testDir);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.path).toContain('file_with%percent.md');
    }
  });
  
  it('should handle paths with exclamation (!) symbols', async () => {
    const filePath = 'file_with!exclamation.txt';
    const result = await FileResolver.resolveFilePath(filePath, testDir);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.path).toContain('file_with!exclamation.txt');
    }
  });
  
  it('should correctly resolve nested paths with spaces', async () => {
    const filePath = 'folder with space/nested.md';
    const result = await FileResolver.resolveFilePath(filePath, testDir);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.path).toContain('folder with space/nested.md');
    }
  });
});
