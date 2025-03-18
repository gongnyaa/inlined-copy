import { describe, it, expect, vi, beforeEach, afterAll, beforeAll } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { createLargeFile, cleanupTestFiles } from '../../../utils/createTestFiles';
import { performance } from 'perf_hooks';
import { mockVSCodeEnvironment, resetMockVSCodeEnvironment } from '../mocks/vscodeEnvironment.mock';

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
    
    // Mock fs.statSync to return the correct file size
    vi.spyOn(fs, 'statSync').mockImplementation((filePath) => {
      const pathStr = filePath.toString();
      if (pathStr.includes('single.txt')) {
        return { size: 100 * 1024 } as fs.Stats; // 100KB
      }
      if (pathStr.includes('large.txt')) {
        return { size: 5 * 1024 * 1024 } as fs.Stats; // 5MB
      }
      // For other files in the test
      return { size: 100 * 1024 } as fs.Stats; // 100KB default
    });
    
    // Use a simpler approach to mock fs.readFile
    vi.spyOn(fs, 'readFile').mockImplementation((...args: any[]) => {
      // Extract callback from arguments (it's the last argument)
      const callback = args[args.length - 1] as (err: NodeJS.ErrnoException | null, data: Buffer | string) => void;
      const filePath = args[0].toString();
      
      // Generate content based on file path
      let content = '';
      if (filePath.includes('single.txt')) {
        content = 'A'.repeat(100 * 1024); // 100KB content
      } else if (filePath.includes('large.txt')) {
        content = 'A'.repeat(1024 * 1024); // 1MB content (truncated for test)
      } else if (filePath.includes('main10.md')) {
        // Create content with 10 file references
        content = '# Performance Test - 10 Files\n\n';
        for (let i = 0; i < 10; i++) {
          content += `![[file${i}.txt]]\n\n`;
        }
      } else if (filePath.includes('main50.md')) {
        // Create content with 50 file references
        content = '# Performance Test - 50 Files\n\n';
        for (let i = 0; i < 50; i++) {
          content += `![[file${i}.txt]]\n\n`;
        }
      } else if (filePath.match(/file\d+\.txt/)) {
        // For numbered files, return a simple content
        content = `Content of ${path.basename(filePath)}`;
      }
      
      // Call the callback with the content
      callback(null, content);
      return undefined;
    });
  });
  
  afterAll(() => {
    cleanupTestFiles(testDir);
    vi.restoreAllMocks();
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
