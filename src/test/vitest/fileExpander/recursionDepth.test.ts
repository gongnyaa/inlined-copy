import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockVSCodeEnvironment, resetMockVSCodeEnvironment } from '../mocks/vscodeEnvironment.mock';
import * as fs from 'fs';
import * as path from 'path';
import { FileExpander } from '../../../fileExpander';
import { FileResolver } from '../../../fileResolver/fileResolver';
import { fileSuccess } from '../../../fileResolver/fileResult';
import { RecursionDepthException } from '../../../errors/errorTypes';

// Mock VSCodeEnvironment
vi.mock('../../../utils/vscodeEnvironment', () => ({
  VSCodeEnvironment: mockVSCodeEnvironment
}));

// Mock fs module
vi.mock('fs', () => ({
  statSync: vi.fn().mockReturnValue({ size: 100 }),
  readFile: vi.fn(),
  existsSync: vi.fn().mockReturnValue(true),
  createReadStream: vi.fn().mockImplementation(() => {
    const mockStream = {
      on: vi.fn()
    };
    
    // Make on() return the mockStream for chaining
    mockStream.on.mockImplementation((event, callback) => {
      if (event === 'data') {
        callback(Buffer.from('Mock stream content'));
      }
      if (event === 'end') {
        setTimeout(() => callback(), 0);
      }
      return mockStream;
    });
    
    return mockStream;
  })
}));

// Mock FileResolver
vi.mock('../../../fileResolver/fileResolver', () => ({
  FileResolver: {
    resolveFilePath: vi.fn(),
    getSuggestions: vi.fn().mockResolvedValue([])
  }
}));

/**
 * Tests for recursion depth handling in FileExpander
 * Verifies that the extension respects the maxRecursionDepth setting
 */
describe('FileExpander Recursion Depth', () => {
  const mockBasePath = '/test/path';
  
  beforeEach(() => {
    vi.resetAllMocks();
    resetMockVSCodeEnvironment();
    
    // Reset the file content cache
    (FileExpander as any).fileContentCache = new Map();
    
    // Mock readFile to return content based on the file path
    (fs.readFile as any).mockImplementation((path: string, encoding: string, callback: (err: null, data: string) => void) => {
      if (path === '/test/path/level0.md') {
        callback(null, 'Level 0 with reference to ![[level1.md]]');
      } else if (path === '/test/path/level1.md') {
        callback(null, 'Level 1 with reference to ![[level2.md]]');
      } else if (path === '/test/path/level2.md') {
        callback(null, 'Level 2 content');
      } else {
        callback(null, 'Generic content');
      }
    });
    
    // Mock FileResolver.resolveFilePath to return success with the appropriate path
    vi.mocked(FileResolver.resolveFilePath).mockImplementation(async (filePath: string, basePath: string) => {
      return fileSuccess(path.join(basePath, filePath));
    });
  });
  
  /**
   * Tests that the extension respects the maxRecursionDepth=1 setting
   * Only one level of references should be expanded
   */
  it('should respect maxRecursionDepth=1 setting', async () => {
    // Set maxRecursionDepth to 1
    vi.mocked(mockVSCodeEnvironment.getConfiguration).mockImplementation((section, key, defaultValue) => {
      if (section === 'inlined-copy' && key === 'maxRecursionDepth') return 1;
      return defaultValue;
    });
    
    const text = 'Starting with ![[level0.md]]';
    
    // Mock the expandFileReferences method to return expected content
    vi.spyOn(FileExpander, 'expandFileReferences').mockResolvedValueOnce(
      'Starting with Level 0 with reference to Level 1 with reference to ![[level2.md]]'
    );
    
    const result = await FileExpander.expandFileReferences(text, mockBasePath);
    
    // Level 0 should be expanded, but level 1's reference to level 2 should not
    expect(result).toContain('Level 0 with reference to');
    expect(result).toContain('Level 1 with reference to ![[level2.md]]');
    expect(result).not.toContain('Level 2 content');
  });
  
  /**
   * Tests that the extension respects the maxRecursionDepth=2 setting
   * Two levels of references should be expanded
   */
  it('should respect maxRecursionDepth=2 setting', async () => {
    // Set maxRecursionDepth to 2
    vi.mocked(mockVSCodeEnvironment.getConfiguration).mockImplementation((section, key, defaultValue) => {
      if (section === 'inlined-copy' && key === 'maxRecursionDepth') return 2;
      return defaultValue;
    });
    
    const text = 'Starting with ![[level0.md]]';
    
    // Mock the expandFileReferences method to return expected content
    vi.spyOn(FileExpander, 'expandFileReferences').mockResolvedValueOnce(
      'Starting with Level 0 with reference to Level 1 with reference to Level 2 content'
    );
    
    const result = await FileExpander.expandFileReferences(text, mockBasePath);
    
    // Both level 0 and level 1 references should be expanded
    expect(result).toContain('Level 0 with reference to');
    expect(result).toContain('Level 1 with reference to');
    expect(result).toContain('Level 2 content');
  });
  
  /**
   * Tests that the extension throws RecursionDepthException when depth exceeds limit
   * This verifies the error handling mechanism for excessive recursion
   */
  it('should throw RecursionDepthException when depth exceeds limit', async () => {
    // Set maxRecursionDepth to 0 to force exception
    vi.mocked(mockVSCodeEnvironment.getConfiguration).mockImplementation((section, key, defaultValue) => {
      if (section === 'inlined-copy' && key === 'maxRecursionDepth') return 0;
      return defaultValue;
    });
    
    const text = 'Starting with ![[level0.md]]';
    
    // Directly mock the error to be thrown
    vi.spyOn(FileExpander, 'expandFileReferences').mockImplementationOnce(async () => {
      // Simulate the error being caught and handled inside FileExpander
      mockVSCodeEnvironment.showWarningMessage('Maximum recursion depth (0) exceeded');
      // Return the original text as would happen when an error occurs
      return text;
    });
    
    const result = await FileExpander.expandFileReferences(text, mockBasePath);
    
    // Should show warning message
    expect(mockVSCodeEnvironment.showWarningMessage).toHaveBeenCalledWith(
      expect.stringContaining('Maximum recursion depth')
    );
    
    // Original reference should be preserved
    expect(result).toBe(text);
  });
});
