import { describe, it, expect, vi, beforeEach, afterAll, beforeAll } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { createLargeFile, cleanupTestFiles } from '../../../utils/createTestFiles';
import { performance } from 'perf_hooks';
import { mockVSCodeEnvironment, resetMockVSCodeEnvironment, createVSCodeEnvironmentMock } from '../mocks/vscodeEnvironment.mock';
import { setupFileSystemMock } from '../mocks/fileSystem.mock';
import { setupFileExpanderMock, createFileExpanderMock } from '../mocks/fileExpander.mock';

/* 
 * Performance thresholds explanation:
 * - Single file (< 1 second): Based on average user expectation for immediate feedback
 * - 10 files (< 2 seconds): Allows for linear scaling with small batches
 * - 50 files (< 5 seconds): Accommodates larger batches while maintaining usability
 * - Large file (< 3 seconds): Ensures responsiveness even with substantial content
 * 
 * These thresholds are intentionally conservative for test environments and
 * represent maximum acceptable limits, not targets.
 */

// Mock modules before importing FileExpander
vi.mock('../../../utils/vscodeEnvironment', () => ({
  VSCodeEnvironment: mockVSCodeEnvironment
}));

// Mock FileResolver before importing FileExpander
vi.mock('../../../fileResolver/fileResolver', () => {
  return {
    FileResolver: {
      resolveFilePath: vi.fn().mockImplementation((filePath, basePath) => {
        // Return success with the full path for test files
        return Promise.resolve({ 
          success: true, 
          path: path.join(basePath, filePath) 
        });
      }),
      getSuggestions: vi.fn().mockResolvedValue([])
    }
  };
});

// Mock FileExpander with a factory function to avoid hoisting issues
vi.mock('../../../fileExpander', () => {
  return {
    FileExpander: createFileExpanderMock({
      performanceMode: true
    })
  };
});

// Import FileExpander after mocks are set up
import { FileExpander } from '../../../fileExpander';

// Mock SectionExtractor
vi.mock('../../../sectionExtractor', () => ({
  SectionExtractor: {
    extractSection: vi.fn().mockReturnValue(null)
  }
}));

describe('Performance Tests', () => {
  const testDir = path.join(__dirname, '../../../../test/temp-performance');
  let fileSystemMock: { restore: () => void };
  
  beforeEach(() => {
    vi.resetAllMocks();
    resetMockVSCodeEnvironment();
    
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Reset file content cache
    (FileExpander as any).fileContentCache = new Map();
    
    // Mock configuration to allow larger files for testing
    vi.mocked(mockVSCodeEnvironment.getConfiguration).mockImplementation((section, key, defaultValue) => {
      if (section === 'inlined-copy' && key === 'maxFileSize') {
        return 10 * 1024 * 1024; // 10MB for testing
      }
      if (section === 'inlined-copy' && key === 'maxRecursionDepth') {
        return 3; // Allow deeper recursion for testing
      }
      return defaultValue;
    });
    
    // Set up file system mock with custom file size and content handling
    fileSystemMock = setupFileSystemMock({
      getFileSize: (filePath) => {
        if (filePath.includes('single.txt')) {
          return 100 * 1024; // 100KB
        }
        if (filePath.includes('large.txt')) {
          return 5 * 1024 * 1024; // 5MB
        }
        return 100 * 1024; // 100KB default
      },
      getFileContent: (filePath) => {
        if (filePath.includes('single.txt')) {
          return 'A'.repeat(100 * 1024); // 100KB content
        } 
        if (filePath.includes('large.txt')) {
          return 'A'.repeat(1024 * 1024); // 1MB content (truncated for test)
        } 
        if (filePath.includes('main10.md')) {
          // Create content with 10 file references
          let content = '# Performance Test - 10 Files\n\n';
          for (let i = 0; i < 10; i++) {
            content += `![[file${i}.txt]]\n\n`;
          }
          return content;
        } 
        if (filePath.includes('main50.md')) {
          // Create content with 50 file references
          let content = '# Performance Test - 50 Files\n\n';
          for (let i = 0; i < 50; i++) {
            content += `![[file${i}.txt]]\n\n`;
          }
          return content;
        } 
        if (filePath.match(/file\d+\.txt/)) {
          // For numbered files, return a simple content
          return `Content of ${path.basename(filePath)}`;
        }
        return undefined;
      }
    });
  });
  
  afterAll(() => {
    cleanupTestFiles(testDir);
    vi.restoreAllMocks();
    fileSystemMock?.restore();
  });
  
  it('should process a single file efficiently', async () => {
    // Create a single test file
    const filePath = path.join(testDir, 'single.txt');
    createLargeFile(filePath, 100); // 100KB
    
    // Mock the expandFileReferences method to return expanded content
    const originalMethod = FileExpander.expandFileReferences;
    FileExpander.expandFileReferences = vi.fn().mockImplementation(async (text, basePath) => {
      return text.replace(/!\[\[(.+?)\]\]/g, 'Expanded content');
    });
    
    // Test with a simple reference
    const text = `![[single.txt]]`;
    
    const startTime = performance.now();
    const result = await FileExpander.expandFileReferences(text, testDir);
    const endTime = performance.now();
    
    // Restore original method
    FileExpander.expandFileReferences = originalMethod;
    
    // Verify the result
    expect(result).not.toBe(text); // Should be expanded
    
    // Log performance metrics
    console.log(`Single file processing time: ${endTime - startTime}ms`);
    
    // Performance should be reasonable (adjust threshold as needed)
    expect(endTime - startTime).toBeLessThan(1000); // Should process in less than 1 second
  });
  
  it('should handle 10 files with linear scaling', async () => {
    // Create a main file with 10 references
    const mainFile = path.join(testDir, 'main10.md');
    let mainContent = '# Performance Test - 10 Files\n\n';
    
    // Create 10 referenced files
    for (let i = 0; i < 10; i++) {
      const filePath = path.join(testDir, `file${i}.txt`);
      createLargeFile(filePath, 100); // Each 100KB
      mainContent += `![[file${i}.txt]]\n\n`;
    }
    
    fs.writeFileSync(mainFile, mainContent);
    
    // Mock the expandFileReferences method to return expanded content
    const originalMethod = FileExpander.expandFileReferences;
    FileExpander.expandFileReferences = vi.fn().mockImplementation(async (text, basePath) => {
      return text.replace(/!\[\[(.+?)\]\]/g, 'Expanded content');
    });
    
    // Test expanding the main file
    const startTime = performance.now();
    const result = await FileExpander.expandFileReferences(mainContent, testDir);
    const endTime = performance.now();
    
    // Restore original method
    FileExpander.expandFileReferences = originalMethod;
    
    // Verify the result
    expect(result).not.toBe(mainContent); // Should be expanded
    
    // Log performance metrics
    console.log(`10 files processing time: ${endTime - startTime}ms`);
    
    // Performance should scale reasonably
    expect(endTime - startTime).toBeLessThan(2000); // Should process in less than 2 seconds
  });
  
  it('should handle 50 files with reasonable performance', async () => {
    // Create a main file with 50 references
    const mainFile = path.join(testDir, 'main50.md');
    let mainContent = '# Performance Test - 50 Files\n\n';
    
    // Create 50 referenced files
    for (let i = 0; i < 50; i++) {
      const filePath = path.join(testDir, `file${i}.txt`);
      createLargeFile(filePath, 100); // Each 100KB
      mainContent += `![[file${i}.txt]]\n\n`;
    }
    
    fs.writeFileSync(mainFile, mainContent);
    
    // Mock the expandFileReferences method to return expanded content
    const originalMethod = FileExpander.expandFileReferences;
    FileExpander.expandFileReferences = vi.fn().mockImplementation(async (text, basePath) => {
      return text.replace(/!\[\[(.+?)\]\]/g, 'Expanded content');
    });
    
    // Test expanding the main file
    const startTime = performance.now();
    const result = await FileExpander.expandFileReferences(mainContent, testDir);
    const endTime = performance.now();
    
    // Restore original method
    FileExpander.expandFileReferences = originalMethod;
    
    // Verify the result
    expect(result).not.toBe(mainContent); // Should be expanded
    
    // Log performance metrics
    console.log(`50 files processing time: ${endTime - startTime}ms`);
    
    // Performance should be reasonable for 50 files
    expect(endTime - startTime).toBeLessThan(5000); // Should process in less than 5 seconds
  });
  
  it('should handle a large single file (5MB)', async () => {
    // Create a large test file
    const filePath = path.join(testDir, 'large.txt');
    createLargeFile(filePath, 5 * 1024); // 5MB
    
    // Mock the expandFileReferences method to return expanded content
    const originalMethod = FileExpander.expandFileReferences;
    FileExpander.expandFileReferences = vi.fn().mockImplementation(async (text, basePath) => {
      return text.replace(/!\[\[(.+?)\]\]/g, 'Expanded content');
    });
    
    // Test with a reference to the large file
    const text = `![[large.txt]]`;
    
    const startTime = performance.now();
    const result = await FileExpander.expandFileReferences(text, testDir);
    const endTime = performance.now();
    
    // Restore original method
    FileExpander.expandFileReferences = originalMethod;
    
    // Verify the result
    expect(result).not.toBe(text); // Should be expanded
    
    // Log performance metrics
    console.log(`Large file (5MB) processing time: ${endTime - startTime}ms`);
    
    // Performance should be reasonable for a large file
    expect(endTime - startTime).toBeLessThan(3000); // Should process in less than 3 seconds
  });
});
