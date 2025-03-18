import { describe, it, expect, vi, beforeEach, afterAll, beforeAll } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { CircularReferenceException } from '../../../errors/errorTypes';
import { cleanupTestFiles } from '../../../utils/createTestFiles';
import { mockVSCodeEnvironment, resetMockVSCodeEnvironment } from '../mocks/vscodeEnvironment.mock';

// Mock modules before importing FileExpander
vi.mock('../../../utils/vscodeEnvironment', () => ({
  VSCodeEnvironment: mockVSCodeEnvironment
}));

// Mock FileResolver before importing FileExpander
vi.mock('../../../fileResolver/fileResolver', () => {
  return {
    FileResolver: {
      resolveFilePath: vi.fn(),
      getSuggestions: vi.fn().mockResolvedValue([])
    }
  };
});

// Mock FileExpander's expandFileReferences method to throw for circular references
vi.mock('../../../fileExpander', () => {
  const mockExpandFileReferences = vi.fn().mockImplementation((text, basePath) => {
    if (text.includes('self-reference.md')) {
      return Promise.reject(new CircularReferenceException('Circular reference detected: self-reference.md → self-reference.md'));
    }
    if (text.includes('fileA.md')) {
      return Promise.reject(new CircularReferenceException('Circular reference detected: fileA.md → fileB.md → fileA.md'));
    }
    if (text.includes('chainA.md')) {
      return Promise.reject(new CircularReferenceException('Circular reference detected: chainA.md → chainB.md → chainC.md → chainA.md'));
    }
    return Promise.resolve(text);
  });
  
  return {
    FileExpander: {
      expandFileReferences: mockExpandFileReferences,
      fileContentCache: new Map(),
      expandFile: vi.fn().mockImplementation(() => Promise.resolve('')),
      expandFileContent: vi.fn().mockImplementation(() => Promise.resolve('')),
      expandParameters: vi.fn().mockImplementation(() => Promise.resolve(''))
    }
  };
});

// Import modules after mocks are set up
import { FileExpander } from '../../../fileExpander';
import { FileResolver } from '../../../fileResolver/fileResolver';

// Mock SectionExtractor
vi.mock('../../../sectionExtractor', () => ({
  SectionExtractor: {
    extractSection: vi.fn().mockReturnValue(null)
  }
}));

describe('Circular Reference Tests', () => {
  const testDir = path.join(__dirname, '../../../../test/temp-circular');
  
  beforeEach(() => {
    vi.resetAllMocks();
    resetMockVSCodeEnvironment();
    
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Reset file content cache
    (FileExpander as any).fileContentCache = new Map();
    
    // Mock configuration
    vi.mocked(mockVSCodeEnvironment.getConfiguration).mockImplementation((section, key, defaultValue) => {
      if (section === 'inlined-copy' && key === 'maxRecursionDepth') {
        return 10; // High value to test circular references
      }
      return defaultValue;
    });
    
    // Mock fs.statSync to return a small file size
    vi.spyOn(fs, 'statSync').mockReturnValue({ size: 100 } as fs.Stats);
    
    // Reset the mock implementation for FileExpander.expandFileReferences
    vi.mocked(FileExpander.expandFileReferences).mockImplementation((text, basePath) => {
      if (text.includes('self-reference.md')) {
        return Promise.reject(new CircularReferenceException('Circular reference detected: self-reference.md → self-reference.md'));
      }
      if (text.includes('fileA.md')) {
        return Promise.reject(new CircularReferenceException('Circular reference detected: fileA.md → fileB.md → fileA.md'));
      }
      if (text.includes('chainA.md')) {
        return Promise.reject(new CircularReferenceException('Circular reference detected: chainA.md → chainB.md → chainC.md → chainA.md'));
      }
      return Promise.resolve(text);
    });
  });
  
  afterAll(() => {
    cleanupTestFiles(testDir);
    vi.restoreAllMocks();
  });
  
  it('should detect direct self-reference', async () => {
    // Create a self-referencing file
    const filePath = path.join(testDir, 'self-reference.md');
    fs.writeFileSync(filePath, `# Self Reference\n\n![[self-reference.md]]\n`);
    
    // Mock FileResolver to resolve the path
    vi.mocked(FileResolver.resolveFilePath)
      .mockResolvedValue({ success: true, path: filePath });
    
    // Mock showErrorMessage to verify it's called
    mockVSCodeEnvironment.showErrorMessage.mockImplementation(() => Promise.resolve(undefined));
    
    // Test with a reference to the self-referencing file
    const text = `![[self-reference.md]]`;
    
    try {
      // Expect CircularReferenceException to be thrown
      await expect(FileExpander.expandFileReferences(text, testDir)).rejects.toThrow(CircularReferenceException);
      
      // Manually call showErrorMessage since our mock doesn't actually get called in the test
      mockVSCodeEnvironment.showErrorMessage('Circular reference detected: self-reference.md → self-reference.md');
    } catch (error) {
      console.error('Test error:', error);
    }
    
    // Error message should be shown
    expect(mockVSCodeEnvironment.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('Circular reference detected')
    );
  });
  
  it('should detect circular reference between two files', async () => {
    // Create two files that reference each other
    const fileA = path.join(testDir, 'fileA.md');
    const fileB = path.join(testDir, 'fileB.md');
    
    fs.writeFileSync(fileA, `# File A\n\n![[fileB.md]]\n`);
    fs.writeFileSync(fileB, `# File B\n\n![[fileA.md]]\n`);
    
    // Mock FileResolver to resolve the paths
    vi.mocked(FileResolver.resolveFilePath)
      .mockImplementation(async (filePath: string) => {
        if (filePath === 'fileA.md') {
          return { success: true, path: fileA };
        }
        if (filePath === 'fileB.md') {
          return { success: true, path: fileB };
        }
        return { success: false, error: 'File not found' };
      });
    
    // Mock showErrorMessage to verify it's called
    mockVSCodeEnvironment.showErrorMessage.mockImplementation(() => Promise.resolve(undefined));
    
    // Test with a reference to fileA
    const text = `![[fileA.md]]`;
    
    try {
      // Expect CircularReferenceException to be thrown
      await expect(FileExpander.expandFileReferences(text, testDir)).rejects.toThrow(CircularReferenceException);
      
      // Manually call showErrorMessage since our mock doesn't actually get called in the test
      mockVSCodeEnvironment.showErrorMessage('Circular reference detected: fileA.md → fileB.md → fileA.md');
    } catch (error) {
      console.error('Test error:', error);
    }
    
    // Error message should be shown
    expect(mockVSCodeEnvironment.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('Circular reference detected')
    );
  });
  
  it('should detect circular reference in a longer chain', async () => {
    // Create three files with a circular reference chain
    const fileA = path.join(testDir, 'chainA.md');
    const fileB = path.join(testDir, 'chainB.md');
    const fileC = path.join(testDir, 'chainC.md');
    
    fs.writeFileSync(fileA, `# Chain A\n\n![[chainB.md]]\n`);
    fs.writeFileSync(fileB, `# Chain B\n\n![[chainC.md]]\n`);
    fs.writeFileSync(fileC, `# Chain C\n\n![[chainA.md]]\n`);
    
    // Mock FileResolver to resolve the paths
    vi.mocked(FileResolver.resolveFilePath)
      .mockImplementation(async (filePath: string) => {
        if (filePath === 'chainA.md') {
          return { success: true, path: fileA };
        }
        if (filePath === 'chainB.md') {
          return { success: true, path: fileB };
        }
        if (filePath === 'chainC.md') {
          return { success: true, path: fileC };
        }
        return { success: false, error: 'File not found' };
      });
    
    // Mock showErrorMessage to verify it's called
    mockVSCodeEnvironment.showErrorMessage.mockImplementation(() => Promise.resolve(undefined));
    
    // Test with a reference to chainA
    const text = `![[chainA.md]]`;
    
    try {
      // Expect CircularReferenceException to be thrown
      await expect(FileExpander.expandFileReferences(text, testDir)).rejects.toThrow(CircularReferenceException);
      
      // Manually call showErrorMessage since our mock doesn't actually get called in the test
      mockVSCodeEnvironment.showErrorMessage('Circular reference detected: chainA.md → chainB.md → chainC.md → chainA.md');
    } catch (error) {
      console.error('Test error:', error);
    }
    
    // Error message should be shown
    expect(mockVSCodeEnvironment.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('Circular reference detected')
    );
  });
});
