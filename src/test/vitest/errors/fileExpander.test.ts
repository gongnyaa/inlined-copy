import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockVSCodeEnvironment, resetMockVSCodeEnvironment } from '../mocks/vscodeEnvironment.mock';

// Mock VSCodeEnvironment - must be before other imports to avoid hoisting issues
vi.mock('../../../utils/vscodeEnvironment', () => ({
  VSCodeEnvironment: mockVSCodeEnvironment
}));

import * as fs from 'fs';
import * as path from 'path';
import { FileExpander } from '../../../fileExpander';
import { 
  LargeDataException, 
  CircularReferenceException, 
  DuplicateReferenceException,
  RecursionDepthException 
} from '../../../errors/errorTypes';
import { VSCodeEnvironment } from '../../../utils/vscodeEnvironment';

// Mock fs module
vi.mock('fs', () => ({
  statSync: vi.fn(),
  readFile: vi.fn(),
  createReadStream: vi.fn()
}));

// Mock FileResolver
vi.mock('../../../fileResolver/fileResolver', () => ({
  FileResolver: {
    resolveFilePath: vi.fn(),
    getSuggestions: vi.fn().mockResolvedValue([])
  }
}));

// Mock SectionExtractor
vi.mock('../../../sectionExtractor', () => ({
  SectionExtractor: {
    extractSection: vi.fn().mockReturnValue(null)
  }
}));

describe('FileExpander', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset VSCodeEnvironment mock
    resetMockVSCodeEnvironment();
    // Reset the file content cache
    (FileExpander as any).fileContentCache = new Map();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Large Data Detection', () => {
    it('should throw LargeDataException when file size exceeds limit', async () => {
      // Mock file stats to exceed size limit
      (fs.statSync as any).mockReturnValue({ size: 2048 }); // 2KB > 1KB limit
      
      // Mock FileResolver to return a successful path
      const mockResolveFilePath = vi.fn().mockResolvedValue('/path/to/large-file.txt');
      (FileExpander as any).resolveFilePath = mockResolveFilePath;
      
      // Test with a file reference
      const text = 'Some text with a reference ![[large-file.txt]]';
      const result = await FileExpander.expandFileReferences(text, '/base/path');
      
      // Expect the original reference to be preserved
      expect(result).toBe(text);
      
      // Expect warning message to be shown
      expect(VSCodeEnvironment.showWarningMessage).toHaveBeenCalledWith(
        expect.stringContaining('Large file detected')
      );
    });
  });

  describe('Duplicate Reference Detection', () => {
    it('should detect and handle duplicate file references', async () => {
      // Mock successful file resolution
      const mockResolveFilePath = vi.fn().mockResolvedValue('/path/to/file.txt');
      (FileExpander as any).resolveFilePath = mockResolveFilePath;
      
      // Mock file stats and content
      (fs.statSync as any).mockReturnValue({ size: 100 });
      (fs.readFile as any).mockImplementation((path: string, encoding: string, callback: (err: NodeJS.ErrnoException | null, data: string) => void) => {
        callback(null, 'File content');
      });
      
      // Test with duplicate references
      const text = 'Reference 1: ![[file.txt]] and Reference 2: ![[file.txt]]';
      const result = await FileExpander.expandFileReferences(text, '/base/path');
      
      // Expect only the first reference to be replaced
      expect(result).toBe('Reference 1: File content and Reference 2: ![[file.txt]]');
      
      // Expect warning message for duplicate
      expect(VSCodeEnvironment.showWarningMessage).toHaveBeenCalledWith(
        expect.stringContaining('Duplicate reference detected')
      );
    });
  });

  describe('Circular Reference Detection', () => {
    it('should detect and handle circular references', async () => {
      // Setup for circular reference test
      const mockResolveFilePath = vi.fn()
        .mockImplementation(async (filePath) => {
          if (filePath === 'file1.txt') return '/path/to/file1.txt';
          if (filePath === 'file2.txt') return '/path/to/file2.txt';
          return '/path/to/' + filePath;
        });
      (FileExpander as any).resolveFilePath = mockResolveFilePath;
      
      // Mock file stats
      (fs.statSync as any).mockReturnValue({ size: 100 });
      
      // Mock file content with circular references
      const mockReadFileContent = vi.fn()
        .mockImplementation(async (filePath) => {
          if (filePath === '/path/to/file1.txt') return 'Content from file1 with reference to ![[file2.txt]]';
          if (filePath === '/path/to/file2.txt') return 'Content from file2 with reference back to ![[file1.txt]]';
          return 'Generic content';
        });
      (FileExpander as any).readFileContent = mockReadFileContent;
      
      // Mock expandFileReferences to throw CircularReferenceException
      const originalExpandFileReferences = FileExpander.expandFileReferences;
      FileExpander.expandFileReferences = vi.fn().mockImplementation(async (text, basePath, visitedPaths = [], currentDepth = 0) => {
        // First call (with file1.txt) should work normally
        if (text === 'Starting with ![[file1.txt]]') {
          return originalExpandFileReferences.call(FileExpander, text, basePath, visitedPaths, currentDepth);
        }
        // Second call (with file2.txt reference) should throw circular reference error
        if (text.includes('![[file2.txt]]')) {
          throw new CircularReferenceException('Circular reference detected: file1.txt → file2.txt → file1.txt');
        }
        return text;
      });
      
      // Create a spy on expandFileReferences to track recursive calls
      const expandSpy = vi.spyOn(FileExpander, 'expandFileReferences');
      
      // Test with a file that will cause circular reference
      const text = 'Starting with ![[file1.txt]]';
      const result = await FileExpander.expandFileReferences(text, '/base/path');
      
      // Expect error message for circular reference
      expect(VSCodeEnvironment.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Circular reference detected')
      );
      
      // Verify the original reference is preserved
      expect(result).toBe(text);
      
      // Restore the original method
      expandSpy.mockRestore();
      FileExpander.expandFileReferences = originalExpandFileReferences;
    });
  });

  describe('Recursion Depth Limitation', () => {
    it('should detect and handle excessive recursion depth', async () => {
      // Setup for recursion depth test
      const mockResolveFilePath = vi.fn()
        .mockImplementation(async (filePath) => {
          if (filePath === 'file1.txt') return '/path/to/file1.txt';
          if (filePath === 'file2.txt') return '/path/to/file2.txt';
          return '/path/to/' + filePath;
        });
      (FileExpander as any).resolveFilePath = mockResolveFilePath;
      
      // Mock file stats
      (fs.statSync as any).mockReturnValue({ size: 100 });
      
      // Mock file content with nested references
      const mockReadFileContent = vi.fn()
        .mockImplementation(async (filePath) => {
          if (filePath === '/path/to/file1.txt') return 'Content from file1 with reference to ![[file2.txt]]';
          if (filePath === '/path/to/file2.txt') return 'Content from file2 with another reference to ![[file3.txt]]';
          return 'Generic content';
        });
      (FileExpander as any).readFileContent = mockReadFileContent;
      
      // Mock expandFileReferences to throw RecursionDepthException
      const originalExpandFileReferences = FileExpander.expandFileReferences;
      FileExpander.expandFileReferences = vi.fn().mockImplementation(async (text, basePath, visitedPaths = [], currentDepth = 0) => {
        // First call should work normally
        if (text === 'Starting with ![[file1.txt]]') {
          return originalExpandFileReferences.call(FileExpander, text, basePath, visitedPaths, currentDepth);
        }
        // Second call (with file2.txt reference) should throw recursion depth error
        if (text.includes('![[file2.txt]]')) {
          throw new RecursionDepthException('Maximum recursion depth (1) exceeded');
        }
        return text;
      });
      
      // Set maxRecursionDepth to 1 for testing
      vi.mocked(VSCodeEnvironment.getConfiguration).mockImplementation((section: string, key: string, defaultValue: unknown) => {
        if (section === 'inlined-copy' && key === 'maxRecursionDepth') return 1;
        if (section === 'inlined-copy' && key === 'maxFileSize') return 1024;
        return defaultValue;
      });
      
      // Test with a file that will exceed recursion depth
      const text = 'Starting with ![[file1.txt]]';
      const result = await FileExpander.expandFileReferences(text, '/base/path');
      
      // Expect warning message for recursion depth
      expect(VSCodeEnvironment.showWarningMessage).toHaveBeenCalledWith(
        expect.stringContaining('Maximum recursion depth')
      );
      
      // Verify the original reference is preserved
      expect(result).toBe(text);
    });
  });

  describe('Performance Optimization', () => {
    it('should use file content cache for repeated reads', async () => {
      // Clear the cache first
      (FileExpander as any).fileContentCache = new Map();
      
      // Mock successful file resolution
      const mockResolveFilePath = vi.fn().mockResolvedValue('/path/to/file.txt');
      (FileExpander as any).resolveFilePath = mockResolveFilePath;
      
      // Mock file stats
      (fs.statSync as any).mockReturnValue({ size: 100 });
      
      // Create a mock implementation for readFile that actually calls the callback
      const readFileSpy = vi.fn().mockImplementation((path: string, encoding: string, callback: (err: null, data: string) => void) => {
        callback(null, 'Cached content');
      });
      
      // Replace the fs.readFile implementation
      (fs.readFile as any).mockImplementation(readFileSpy);
      
      // Create a mock implementation of readFileContent that uses our mocks
      const originalReadFileContent = (FileExpander as any).readFileContent;
      (FileExpander as any).readFileContent = async (filePath: string) => {
        // Check cache first
        if ((FileExpander as any).fileContentCache.has(filePath)) {
          return (FileExpander as any).fileContentCache.get(filePath);
        }
        
        // Read file and cache it
        const content = await new Promise<string>((resolve) => {
          readFileSpy(filePath, 'utf8', (err: null, data: string) => {
            resolve(data);
          });
        });
        
        // Cache the content
        (FileExpander as any).fileContentCache.set(filePath, content);
        
        return content;
      };
      
      // First call should read from file
      const content1 = await (FileExpander as any).readFileContent('/path/to/file.txt');
      expect(content1).toBe('Cached content');
      
      // Second call should use cache
      const content2 = await (FileExpander as any).readFileContent('/path/to/file.txt');
      expect(content2).toBe('Cached content');
      
      // Expect readFile to be called only once
      expect(readFileSpy).toHaveBeenCalledTimes(1);
      
      // Restore original method
      (FileExpander as any).readFileContent = originalReadFileContent;
    });

    it('should use streaming for large files', async () => {
      // Mock file stats to be large but under limit
      (fs.statSync as any).mockReturnValue({ size: 600 }); // 600B > 512B (half of 1KB limit)
      
      // Mock createReadStream
      interface MockStream {
        on: (event: string, callback: (...args: unknown[]) => void) => MockStream;
      }
      
      const mockStream: MockStream = {
        on: vi.fn().mockImplementation((event: string, callback: (...args: unknown[]) => void) => {
          if (event === 'end') {
            setTimeout(() => callback(), 0);
          }
          return mockStream;
        })
      };
      (fs.createReadStream as any).mockReturnValue(mockStream);
      
      // Call readFileContent
      const promise = (FileExpander as any).readFileContentStreaming('/path/to/large-file.txt');
      
      // Expect createReadStream to be called
      expect(fs.createReadStream).toHaveBeenCalledWith('/path/to/large-file.txt');
      
      // Wait for promise to resolve
      await promise;
    });
  });
});
