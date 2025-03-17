import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { FileExpander } from '../../../fileExpander';
import { LargeDataException, CircularReferenceException, DuplicateReferenceException } from '../../../errors/errorTypes';

// Mock vscode namespace
vi.mock('vscode', () => ({
  window: {
    showErrorMessage: vi.fn(),
    showWarningMessage: vi.fn(),
    showInformationMessage: vi.fn()
  },
  workspace: {
    getConfiguration: vi.fn().mockReturnValue({
      get: vi.fn().mockImplementation((key) => {
        if (key === 'maxFileSize') return 1024; // 1KB for testing
        return undefined;
      })
    })
  }
}));

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
      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
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
      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
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
      
      // Create a spy on expandFileReferences to track recursive calls
      const expandSpy = vi.spyOn(FileExpander, 'expandFileReferences');
      
      // Test with a file that will cause circular reference
      const text = 'Starting with ![[file1.txt]]';
      const result = await FileExpander.expandFileReferences(text, '/base/path');
      
      // Expect error message for circular reference
      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining('Circular reference detected')
      );
      
      // Verify the original reference is preserved
      expect(result).toBe(text);
      
      // Restore the spy
      expandSpy.mockRestore();
    });
  });

  describe('Performance Optimization', () => {
    it('should use file content cache for repeated reads', async () => {
      // Mock successful file resolution
      const mockResolveFilePath = vi.fn().mockResolvedValue('/path/to/file.txt');
      (FileExpander as any).resolveFilePath = mockResolveFilePath;
      
      // Mock file stats
      (fs.statSync as any).mockReturnValue({ size: 100 });
      
      // Mock file reading
      const readFileMock = vi.fn().mockImplementation((path: string, encoding: string, callback: (err: NodeJS.ErrnoException | null, data: string) => void) => {
        callback(null, 'Cached content');
      });
      (fs.readFile as any) = readFileMock;
      
      // First call should read from file
      await (FileExpander as any).readFileContent('/path/to/file.txt');
      
      // Second call should use cache
      await (FileExpander as any).readFileContent('/path/to/file.txt');
      
      // Expect readFile to be called only once
      expect(readFileMock).toHaveBeenCalledTimes(1);
    });

    it('should use streaming for large files', async () => {
      // Mock file stats to be large but under limit
      (fs.statSync as any).mockReturnValue({ size: 600 }); // 600B > 512B (half of 1KB limit)
      
      // Mock createReadStream
      interface MockStream {
        on: (event: string, callback: (...args: any[]) => void) => MockStream;
      }
      
      const mockStream: MockStream = {
        on: vi.fn().mockImplementation((event: string, callback: (...args: any[]) => void) => {
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
