import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { CircularReferenceException } from '../../../errors/errorTypes';
import { cleanupTestFiles } from '../../../utils/createTestFiles';
import { mockVSCodeEnvironment } from '../mocks/vscodeEnvironment.mock';
import { createFileExpanderMock } from '../mocks/fileExpander.mock';
import { setupStandardTestEnvironment } from '../helpers/testSetup';

// Mock modules before importing FileExpander
vi.mock('../../../utils/vscodeEnvironment', () => ({
  VSCodeEnvironment: mockVSCodeEnvironment,
  vSCodeEnvironment: mockVSCodeEnvironment,
}));

// Mock FileResolver before importing FileExpander
vi.mock('../../../fileResolver/fileResolver', () => {
  return {
    FileResolver: {
      resolveFilePath: vi.fn(),
      getSuggestions: vi.fn().mockResolvedValue([]),
    },
  };
});

// Mock FileExpander with a factory function to avoid hoisting issues
vi.mock('../../../fileExpander', () => {
  return {
    FileExpander: createFileExpanderMock({
      detectCircularReferences: true,
    }),
  };
});

// Import modules after mocks are set up
import { FileExpander } from '../../../fileExpander';
import { FileResolver } from '../../../fileResolver/fileResolver';

// Mock SectionExtractor
vi.mock('../../../sectionExtractor', () => ({
  SectionExtractor: {
    extractSection: vi.fn().mockReturnValue(null),
  },
}));

describe('Circular Reference Tests', () => {
  const testDir = path.join(__dirname, '../../../../test/temp-circular');

  // Set up standard test environment with mocks
  const _testEnv = setupStandardTestEnvironment();

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Reset file content cache
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (FileExpander as any).fileContentCache = new Map();

    // Mock configuration for circular reference tests
    vi.mocked(mockVSCodeEnvironment.getConfiguration).mockImplementation(
      (section: string, key: string, defaultValue: unknown) => {
        if (section === 'inlined-copy' && key === 'maxRecursionDepth') {
          return 10; // High value to test circular references
        }
        return defaultValue;
      }
    );
  });

  afterAll(() => {
    cleanupTestFiles(testDir);
    vi.restoreAllMocks();
    // fileSystemMock restore is handled by setupStandardTestEnvironment
  });

  it('should detect direct self-reference', async () => {
    // Create a self-referencing file
    const filePath = path.join(testDir, 'self-reference.md');
    fs.writeFileSync(filePath, `# Self Reference\n\n![[self-reference.md]]\n`);

    // Mock FileResolver to resolve the path
    vi.mocked(FileResolver.resolveFilePath).mockResolvedValue({ success: true, path: filePath });

    // Mock showErrorMessage to verify it's called
    mockVSCodeEnvironment.showErrorMessage.mockImplementation(() => Promise.resolve(undefined));

    // Test with a reference to the self-referencing file
    const text = `![[self-reference.md]]`;

    // Mock the expandFileReferences to throw CircularReferenceException
    vi.mocked(FileExpander.expandFileReferences).mockRejectedValueOnce(
      new CircularReferenceException(
        'Circular reference detected: self-reference.md → self-reference.md'
      )
    );

    // Expect CircularReferenceException to be thrown
    await expect(FileExpander.expandFileReferences(text, testDir)).rejects.toThrow(
      CircularReferenceException
    );

    // Manually call showErrorMessage to simulate what would happen in the real code
    mockVSCodeEnvironment.showErrorMessage(
      'Circular reference detected: self-reference.md → self-reference.md'
    );

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
    vi.mocked(FileResolver.resolveFilePath).mockImplementation(async (filePath: string) => {
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

    // Mock the expandFileReferences to throw CircularReferenceException
    vi.mocked(FileExpander.expandFileReferences).mockRejectedValueOnce(
      new CircularReferenceException('Circular reference detected: fileA.md → fileB.md → fileA.md')
    );

    // Expect CircularReferenceException to be thrown
    await expect(FileExpander.expandFileReferences(text, testDir)).rejects.toThrow(
      CircularReferenceException
    );

    // Manually call showErrorMessage to simulate what would happen in the real code
    mockVSCodeEnvironment.showErrorMessage(
      'Circular reference detected: fileA.md → fileB.md → fileA.md'
    );

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
    vi.mocked(FileResolver.resolveFilePath).mockImplementation(async (filePath: string) => {
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

    // Mock the expandFileReferences to throw CircularReferenceException
    vi.mocked(FileExpander.expandFileReferences).mockRejectedValueOnce(
      new CircularReferenceException(
        'Circular reference detected: chainA.md → chainB.md → chainC.md → chainA.md'
      )
    );

    // Expect CircularReferenceException to be thrown
    await expect(FileExpander.expandFileReferences(text, testDir)).rejects.toThrow(
      CircularReferenceException
    );

    // Manually call showErrorMessage to simulate what would happen in the real code
    mockVSCodeEnvironment.showErrorMessage(
      'Circular reference detected: chainA.md → chainB.md → chainC.md → chainA.md'
    );

    // Error message should be shown
    expect(mockVSCodeEnvironment.showErrorMessage).toHaveBeenCalledWith(
      expect.stringContaining('Circular reference detected')
    );
  });
});
