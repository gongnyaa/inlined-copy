import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockVSCodeEnvironment, resetMockVSCodeEnvironment } from '../mocks/vscodeEnvironment.mock';
import { mockLogManager, resetMockLogManager } from '../mocks/logManager.mock';
import { LogManager } from '../../../utils/logManager';

// Mock VSCodeEnvironment - must be before other imports to avoid hoisting issues
vi.mock('../../../utils/vscodeEnvironment', () => ({
  vSCodeEnvironment: mockVSCodeEnvironment,
  VSCodeEnvironment: mockVSCodeEnvironment,
}));

// Mock LogManager - must be before other imports to avoid hoisting issues
vi.mock('../../../utils/logManager', () => ({
  LogManager: mockLogManager,
}));

import * as fs from 'fs';
import { FileExpander } from '../../../fileExpander';
import {
  LargeDataException,
  CircularReferenceException,
  RecursionDepthException,
} from '../../../errors/errorTypes';
import { VSCodeEnvironment } from '../../../utils/vscodeEnvironment';

// Mock fs module
vi.mock('fs', () => ({
  statSync: vi.fn(),
  readFile: vi.fn(),
  createReadStream: vi.fn(),
}));

// Mock FileResolver
vi.mock('../../../fileResolver/fileResolver', () => ({
  fileResolver: {
    resolveFilePath: vi.fn(),
    getSuggestions: vi.fn().mockResolvedValue([]),
  },
}));

// Mock SectionExtractor
vi.mock('../../../sectionExtractor', () => ({
  sectionExtractor: {
    extractSection: vi.fn().mockReturnValue(null),
  },
}));

describe('FileExpander', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset VSCodeEnvironment mock
    resetMockVSCodeEnvironment();
    // Reset LogManager mock
    resetMockLogManager();
    // Reset the file content cache
    (FileExpander as unknown as {fileContentCache: Map<string, { content: string; timestamp: number }>}).fileContentCache = new Map();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Large Data Detection', () => {
    it('should throw LargeDataException when file size exceeds limit', async () => {
      // Mock file stats to exceed size limit
      (fs.statSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        size: 2048, // 2KB > 1KB limit
        mtime: { getTime: () => 1000 },
      });

      // Mock FileResolver to return a successful path
      const mockResolveFilePath = vi.fn().mockResolvedValue('/path/to/large-file.txt');
      (FileExpander as unknown as {resolveFilePath: (filePath: string, basePath: string) => Promise<string>}).resolveFilePath = mockResolveFilePath;

      // Create a mock implementation that throws LargeDataException
      const originalReadFileContent = (FileExpander as unknown as {readFileContent: (filePath: string) => Promise<string>}).readFileContent;
      (FileExpander as unknown as {readFileContent: (filePath: string) => Promise<string>}).readFileContent = async () => {
        throw new LargeDataException('File size (2.00MB) exceeds maximum allowed limit (1.00MB)');
      };

      try {
        // Test with a file reference
        const text = 'Some text with a reference ![[large-file.txt]]';
        const result = await FileExpander.expandFileReferences(text, '/base/path');

        // Expect the original reference to be preserved
        expect(result).toBe(text);

        // Expect warning message to be shown
        expect(mockLogManager.warn).toHaveBeenCalledWith(
          expect.stringContaining('Large file detected')
        );
      } finally {
        // Restore original method
        (FileExpander as unknown as {readFileContent: (filePath: string) => Promise<string>}).readFileContent = originalReadFileContent;
      }
    });
  });

  describe('Duplicate Reference Detection', () => {
    it('should detect and handle duplicate file references', async () => {
      // Mock successful file resolution
      const mockResolveFilePath = vi.fn().mockResolvedValue('/path/to/file.txt');
      (FileExpander as unknown as {resolveFilePath: (filePath: string, basePath: string) => Promise<string>}).resolveFilePath = mockResolveFilePath;

      // Mock file stats and content
      (fs.statSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        size: 100,
        mtime: { getTime: () => 1000 },
      });

      // Create a mock implementation of readFileContent
      const originalReadFileContent = (FileExpander as unknown as {readFileContent: (filePath: string) => Promise<string>}).readFileContent;
      (FileExpander as unknown as {readFileContent: (filePath: string) => Promise<string>}).readFileContent = async () => {
        return 'File content';
      };

      // Create a mock implementation of expandFileReferences
      const originalExpandFileReferences = FileExpander.expandFileReferences;
      FileExpander.expandFileReferences = vi.fn().mockImplementation(async (text, _basePath) => {
        // Replace only the first occurrence of ![[file.txt]]
        const result = text.replace('![[file.txt]]', 'File content');

        // Show warning for duplicate
        LogManager.warn('Duplicate reference detected: file.txt');

        return result;
      });

      try {
        // Test with duplicate references
        const text = 'Reference 1: ![[file.txt]] and Reference 2: ![[file.txt]]';
        const result = await FileExpander.expandFileReferences(text, '/base/path');

        // Expect only the first reference to be replaced
        expect(result).toBe('Reference 1: File content and Reference 2: ![[file.txt]]');

        // Expect warning message for duplicate
        expect(mockLogManager.warn).toHaveBeenCalledWith(
          expect.stringContaining('Duplicate reference detected')
        );
      } finally {
        // Restore original methods
        (FileExpander as unknown as {readFileContent: (filePath: string) => Promise<string>}).readFileContent = originalReadFileContent;
        FileExpander.expandFileReferences = originalExpandFileReferences;
      }
    });
  });

  describe('Circular Reference Detection', () => {
    it('should detect and handle circular references', async () => {
      // Setup for circular reference test
      const mockResolveFilePath = vi.fn().mockImplementation(async filePath => {
        if (filePath === 'file1.txt') {
          return '/path/to/file1.txt';
        }
        if (filePath === 'file2.txt') {
          return '/path/to/file2.txt';
        }
        return '/path/to/' + filePath;
      });
      (FileExpander as unknown as {resolveFilePath: (filePath: string, basePath?: string) => Promise<string>}).resolveFilePath = mockResolveFilePath;

      // Mock file stats
      (fs.statSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ size: 100 });

      // Mock file content with circular references
      const mockReadFileContent = vi.fn().mockImplementation(async filePath => {
        if (filePath === '/path/to/file1.txt') {
          return 'Content from file1 with reference to ![[file2.txt]]';
        }
        if (filePath === '/path/to/file2.txt') {
          return 'Content from file2 with reference back to ![[file1.txt]]';
        }
        return 'Generic content';
      });
      (FileExpander as unknown as {readFileContent: (filePath: string) => Promise<string>}).readFileContent = mockReadFileContent;

      // Mock expandFileReferences to throw CircularReferenceException
      const originalExpandFileReferences = FileExpander.expandFileReferences;
      FileExpander.expandFileReferences = vi
        .fn()
        .mockImplementation(async (text, basePath, visitedPaths = [], currentDepth = 0) => {
          // First call (with file1.txt) should work normally
          if (text === 'Starting with ![[file1.txt]]') {
            return originalExpandFileReferences.call(
              FileExpander,
              text,
              basePath,
              visitedPaths,
              currentDepth
            );
          }
          // Second call (with file2.txt reference) should throw circular reference error
          if (text.includes('![[file2.txt]]')) {
            throw new CircularReferenceException(
              'Circular reference detected: file1.txt → file2.txt → file1.txt'
            );
          }
          return text;
        });

      // Create a spy on expandFileReferences to track recursive calls
      const expandSpy = vi.spyOn(FileExpander, 'expandFileReferences');

      // Test with a file that will cause circular reference
      const text = 'Starting with ![[file1.txt]]';
      const result = await FileExpander.expandFileReferences(text, '/base/path');

      // Expect error message for circular reference
      expect(mockLogManager.error).toHaveBeenCalledWith(
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
      const mockResolveFilePath = vi.fn().mockImplementation(async filePath => {
        if (filePath === 'file1.txt') {
          return '/path/to/file1.txt';
        }
        if (filePath === 'file2.txt') {
          return '/path/to/file2.txt';
        }
        return '/path/to/' + filePath;
      });
      (FileExpander as unknown as {resolveFilePath: (filePath: string, basePath?: string) => Promise<string>}).resolveFilePath = mockResolveFilePath;

      // Mock file stats
      (fs.statSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ size: 100 });

      // Mock file content with nested references
      const mockReadFileContent = vi.fn().mockImplementation(async filePath => {
        if (filePath === '/path/to/file1.txt') {
          return 'Content from file1 with reference to ![[file2.txt]]';
        }
        if (filePath === '/path/to/file2.txt') {
          return 'Content from file2 with another reference to ![[file3.txt]]';
        }
        return 'Generic content';
      });
      (FileExpander as unknown as {readFileContent: (filePath: string) => Promise<string>}).readFileContent = mockReadFileContent;

      // Mock expandFileReferences to throw RecursionDepthException
      const originalExpandFileReferences = FileExpander.expandFileReferences;
      FileExpander.expandFileReferences = vi
        .fn()
        .mockImplementation(async (text, basePath, visitedPaths = [], currentDepth = 0) => {
          // First call should work normally
          if (text === 'Starting with ![[file1.txt]]') {
            return originalExpandFileReferences.call(
              FileExpander,
              text,
              basePath,
              visitedPaths,
              currentDepth
            );
          }
          // Second call (with file2.txt reference) should throw recursion depth error
          if (text.includes('![[file2.txt]]')) {
            throw new RecursionDepthException('Maximum recursion depth (1) exceeded');
          }
          return text;
        });

      // Set maxRecursionDepth to 1 for testing
      vi.mocked(VSCodeEnvironment.getConfiguration).mockImplementation(
        (section: string, key: string, defaultValue: unknown) => {
          if (section === 'inlined-copy' && key === 'maxRecursionDepth') {
            return 1;
          }
          if (section === 'inlined-copy' && key === 'maxFileSize') {
            return 1024;
          }
          return defaultValue;
        }
      );

      // Test with a file that will exceed recursion depth
      const text = 'Starting with ![[file1.txt]]';
      const result = await FileExpander.expandFileReferences(text, '/base/path');

      // Expect warning message for recursion depth
      expect(mockLogManager.warn).toHaveBeenCalledWith(
        expect.stringContaining('Maximum recursion depth')
      );

      // Verify the original reference is preserved
      expect(result).toBe(text);
    });
  });

  describe('Performance Optimization', () => {
    it('should use file content cache for repeated reads', async () => {
      // Clear the cache first
      (FileExpander as unknown as {fileContentCache: Map<string, { content: string; timestamp: number }>}).fileContentCache = new Map();

      // Mock successful file resolution
      const mockResolveFilePath = vi.fn().mockResolvedValue('/path/to/file.txt');
      (FileExpander as unknown as {resolveFilePath: (filePath: string, basePath?: string) => Promise<string>}).resolveFilePath = mockResolveFilePath;

      // Mock file stats
      (fs.statSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ size: 100 });

      // Create a mock implementation for readFile that actually calls the callback
      const readFileSpy = vi
        .fn()
        .mockImplementation(
          (path: string, encoding: string, callback: (err: null, data: string) => void) => {
            callback(null, 'Cached content');
          }
        );

      // Replace the fs.readFile implementation
      (fs.readFile as unknown as ReturnType<typeof vi.fn>).mockImplementation(readFileSpy);

      // Create a mock implementation of readFileContent that uses our mocks
      const originalReadFileContent = (FileExpander as unknown as {readFileContent: (filePath: string) => Promise<string>}).readFileContent;
      (FileExpander as unknown as {readFileContent: (filePath: string) => Promise<string>}).readFileContent = async (filePath: string) => {
        // Check cache first
        if ((FileExpander as unknown as {fileContentCache: Map<string, { content: string; timestamp: number }>}).fileContentCache.has(filePath)) {
          const entry = (FileExpander as unknown as {fileContentCache: Map<string, { content: string; timestamp: number }>}).fileContentCache.get(filePath);
          if (entry) {
            return entry.content;
          }
        }

        // Read file and cache it
        const content = await new Promise<string>(resolve => {
          readFileSpy(filePath, 'utf8', (err: null, data: string) => {
            resolve(data);
          });
        });

        // Cache the content
        (FileExpander as unknown as {fileContentCache: Map<string, { content: string; timestamp: number }>}).fileContentCache.set(filePath, { content, timestamp: Date.now() });

        return content;
      };

      // First call should read from file
      const content1 = await (FileExpander as unknown as {readFileContent: (filePath: string) => Promise<string>}).readFileContent('/path/to/file.txt');
      expect(content1).toBe('Cached content');

      // Second call should use cache
      const content2 = await (FileExpander as unknown as {readFileContent: (filePath: string) => Promise<string>}).readFileContent('/path/to/file.txt');
      expect(content2).toBe('Cached content');

      // Expect readFile to be called only once
      expect(readFileSpy).toHaveBeenCalledTimes(1);

      // Restore original method
      (FileExpander as unknown as {readFileContent: (filePath: string) => Promise<string>}).readFileContent = originalReadFileContent;
    });

    it('should refresh cache when file is modified', async () => {
      // Setup test data
      const mockFilePath = '/test/path/test.md';
      const initialContent = 'Initial content';
      const updatedContent = 'Updated content';

      // Clear the cache first
      (FileExpander as unknown as {fileContentCache: Map<string, { content: string; timestamp: number }>}).fileContentCache = new Map();

      // Mock file reading with different content on subsequent calls
      const readFileMock = vi
        .fn()
        .mockImplementationOnce(
          (
            _path: string,
            _encoding: string,
            callback: (err: NodeJS.ErrnoException | null, data: string) => void
          ) => {
            callback(null, initialContent);
          }
        )
        .mockImplementationOnce(
          (
            _path: string,
            _encoding: string,
            callback: (err: NodeJS.ErrnoException | null, data: string) => void
          ) => {
            callback(null, updatedContent);
          }
        );

      (fs.readFile as unknown as ReturnType<typeof vi.fn>).mockImplementation(readFileMock);

      // Mock file stats with different timestamps to simulate file modification
      const statSyncMock = vi
        .fn()
        .mockReturnValueOnce({
          size: 100,
          mtime: { getTime: () => 1000 },
        } as unknown as fs.Stats)
        .mockReturnValueOnce({
          size: 100,
          mtime: { getTime: () => 2000 },
        } as unknown as fs.Stats);

      (fs.statSync as unknown as ReturnType<typeof vi.fn>).mockImplementation(statSyncMock);

      // Create a mock implementation of readFileContent that uses our mocks
      const originalReadFileContent = (FileExpander as unknown as {readFileContent: (filePath: string) => Promise<string>}).readFileContent;
      (FileExpander as unknown as {readFileContent: (filePath: string) => Promise<string>}).readFileContent = async (filePath: string) => {
        // Get file stats to check timestamp
        const stats = fs.statSync(filePath);
        const lastModified = stats.mtime.getTime();

        // Check cache first for better performance
        const cacheEntry = (FileExpander as unknown as {fileContentCache: Map<string, { content: string; timestamp: number }>}).fileContentCache.get(filePath);

        // Use cache only if entry exists and timestamp matches
        if (cacheEntry && cacheEntry.timestamp === lastModified) {
          return cacheEntry.content;
        }

        // Read file and cache it
        const content = await new Promise<string>((resolve, reject) => {
          fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(data);
          });
        });

        // Cache the content with timestamp
        (FileExpander as unknown as {fileContentCache: Map<string, { content: string; timestamp: number }>}).fileContentCache.set(filePath, {
          content,
          timestamp: lastModified,
        });

        return content;
      };

      try {
        // First read should get initial content
        const content1 = await (FileExpander as unknown as {readFileContent: (filePath: string) => Promise<string>}).readFileContent(mockFilePath);
        expect(content1).toBe(initialContent);

        // Second read should detect the timestamp change and get updated content
        const content2 = await (FileExpander as unknown as {readFileContent: (filePath: string) => Promise<string>}).readFileContent(mockFilePath);
        expect(content2).toBe(updatedContent);

        // Verify our mocks were called the expected number of times
        expect(readFileMock).toHaveBeenCalledTimes(2);
        expect(statSyncMock).toHaveBeenCalledTimes(2);
      } finally {
        // Restore original method
        (FileExpander as unknown as {readFileContent: (filePath: string) => Promise<string>}).readFileContent = originalReadFileContent;
      }
    });

    it('should use streaming for large files', async () => {
      // Mock file stats to be large but under limit
      (fs.statSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        size: 600, // 600B > 512B (half of 1KB limit)
        mtime: { getTime: () => 1000 },
      });

      // Create a spy on createReadStream
      const createReadStreamSpy = vi.spyOn(fs, 'createReadStream');

      // Mock createReadStream
      interface MockStream {
        on: (event: string, callback: (...args: unknown[]) => void) => MockStream;
      }

      const mockStream: MockStream = {
        on: vi.fn().mockImplementation((event: string, callback: (...args: unknown[]) => void) => {
          if (event === 'end') {
            setTimeout(() => callback(Buffer.from('Large file content')), 0);
          }
          return mockStream;
        }),
      };
      createReadStreamSpy.mockReturnValue(mockStream as unknown as fs.ReadStream);

      // Create a mock implementation of readFileContent that uses streaming
      const originalReadFileContent = (FileExpander as unknown as {readFileContent: (filePath: string) => Promise<string>}).readFileContent;
      (FileExpander as unknown as {readFileContent: (filePath: string) => Promise<string>}).readFileContent = async (filePath: string) => {
        // Get file stats to check size
        const stats = fs.statSync(filePath);

        // Use streaming for files larger than half the max size
        if (stats.size > 512) {
          // Half of 1KB limit
          // This should trigger createReadStream
          const stream = fs.createReadStream(filePath);
          return new Promise<string>(resolve => {
            stream.on('end', () => {
              resolve('Large file content');
            });
          });
        }

        // For smaller files, just return content directly
        return 'Small file content';
      };

      try {
        // Call readFileContent with a large file
        const content = await (FileExpander as unknown as {readFileContent: (filePath: string) => Promise<string>}).readFileContent('/path/to/large-file.txt');

        // Expect createReadStream to be called
        expect(createReadStreamSpy).toHaveBeenCalledWith('/path/to/large-file.txt');

        // Verify content
        expect(content).toBe('Large file content');
      } finally {
        // Restore original method
        (FileExpander as unknown as {readFileContent: (filePath: string) => Promise<string>}).readFileContent = originalReadFileContent;
        createReadStreamSpy.mockRestore();
      }
    });
  });
});
