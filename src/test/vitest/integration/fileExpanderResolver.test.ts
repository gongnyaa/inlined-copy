import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileExpander } from '../../../fileExpander';
import { FileResolver } from '../../../fileResolver/fileResolver';

// Mock vscode module
vi.mock('vscode', () => {
  return {
    window: {
      showInformationMessage: vi.fn(),
      showErrorMessage: vi.fn(),
      showWarningMessage: vi.fn(),
      showQuickPick: vi.fn()
    },
    env: {
      clipboard: {
        writeText: vi.fn()
      }
    },
    workspace: {
      workspaceFolders: [
        { uri: { fsPath: '/workspace/root' } }
      ],
      findFiles: vi.fn(),
      asRelativePath: (path: string) => path.replace('/workspace/root/', '')
    }
  };
});

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFile: vi.fn((path, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
      options = 'utf8';
    }
    callback(null, '# Test Content');
  })
}));

describe('FileExpander with FileResolver Integration', () => {
  const mockBasePath = '/current/dir';
  const mockContent = '# Test Content';
  
  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();
    
    // Mock FileResolver.resolveFilePath
    vi.spyOn(FileResolver, 'resolveFilePath').mockResolvedValue('/resolved/path/file.md');
  });
  
  it('should use FileResolver to resolve file paths', async () => {
    const text = 'Test with ![[file.md]]';
    const result = await FileExpander.expandFileReferences(text, mockBasePath);
    
    expect(FileResolver.resolveFilePath).toHaveBeenCalledWith('file.md', mockBasePath);
    expect(result).toContain(mockContent);
  });
  
  it('should handle file not found errors with suggestions', async () => {
    // Mock FileResolver to return null (file not found)
    vi.spyOn(FileResolver, 'resolveFilePath').mockResolvedValueOnce(null);
    
    // Mock suggestions
    vi.spyOn(FileResolver, 'getSuggestions').mockResolvedValueOnce(['similar1.md', 'similar2.md']);
    
    const text = 'Test with ![[nonexistent.md]]';
    
    // The FileExpander now keeps the original reference when file is not found
    const result = await FileExpander.expandFileReferences(text, mockBasePath);
    expect(result).toBe(text);
    
    expect(FileResolver.getSuggestions).toHaveBeenCalled();
  });
});
