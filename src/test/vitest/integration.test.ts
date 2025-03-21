import { describe, test, expect, vi, beforeEach } from 'vitest';
import { FileExpander } from '../../fileExpander';
import { FileReader } from '../../fileReader';
import { parseReference, ReferenceType } from '../../referenceParser';
import { SectionExtractor } from '../../sectionExtractor';

// Mock the file reader and logger
vi.mock('../../fileReader', () => ({
  FileReader: {
    readFile: vi.fn(),
  },
}));

vi.mock('../../utils/logManager', () => ({
  LogManager: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../fileResolver/fileResolver', () => ({
  FileResolver: {
    resolveFilePath: vi.fn(path => Promise.resolve({ success: true, path: `/resolved/${path}` })),
    getSuggestions: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock('../../utils/vscodeEnvironment', () => ({
  VSCodeEnvironment: {
    getConfiguration: vi.fn(() => 3), // Default to 3 for any configuration
  },
}));

describe('Integrated File Reference System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should correctly parse and handle different reference types', () => {
    // File only reference
    const fileRef = parseReference('![[document.md]]');
    expect(fileRef.type).toBe(ReferenceType.fileOnly);
    expect(fileRef.filePath).toBe('document.md');

    // Single heading reference
    const headingRef = parseReference('![[document.md#Introduction]]');
    expect(headingRef.type).toBe(ReferenceType.singleHeading);
    expect(headingRef.filePath).toBe('document.md');
    expect(headingRef.headingPath).toEqual(['Introduction']);

    // Nested heading reference
    const nestedRef = parseReference('![[document.md#Chapter 1#Section 1.1]]');
    expect(nestedRef.type).toBe(ReferenceType.nestedHeading);
    expect(nestedRef.filePath).toBe('document.md');
    expect(nestedRef.headingPath).toEqual(['Chapter 1', 'Section 1.1']);
  });

  test('should expand file-only references correctly', async () => {
    // Mock the file reader to return content
    (FileReader.readFile as ReturnType<typeof vi.fn>).mockResolvedValue('Content of file.md');

    // Test simple file reference
    const fileResult = await FileExpander.expandFileReferences('![[file.md]]', '/base');
    expect(fileResult).toBe('Content of file.md');
  });

  test('should expand single heading references correctly', async () => {
    // Mock the file reader
    (FileReader.readFile as ReturnType<typeof vi.fn>).mockResolvedValue(
      '# Heading 1\nContent 1\n## Heading 2\nContent 2'
    );

    // Mock SectionExtractor.extractSection
    const extractSectionSpy = vi
      .spyOn(SectionExtractor, 'extractSection')
      .mockImplementation((content, heading) => {
        if (heading === 'Heading 2') {
          return '## Heading 2\nContent 2';
        }
        return null;
      });

    // Test heading reference
    const result = await FileExpander.expandFileReferences('![[heading.md#Heading 2]]', '/base');
    expect(result).toBe('## Heading 2\nContent 2');
    expect(extractSectionSpy).toHaveBeenCalledWith(expect.any(String), 'Heading 2');
  });

  test('should expand nested heading references correctly', async () => {
    // Mock the file reader
    (FileReader.readFile as ReturnType<typeof vi.fn>).mockResolvedValue(
      '# Main\nMain content\n## Chapter 1\nChapter content\n### Section 1.1\nSection content'
    );

    // Mock SectionExtractor.extractNestedSection
    const extractNestedSectionSpy = vi
      .spyOn(SectionExtractor, 'extractNestedSection')
      .mockImplementation((content, headingPath) => {
        if (headingPath[0] === 'Chapter 1' && headingPath[1] === 'Section 1.1') {
          return '### Section 1.1\nSection content';
        }
        return null;
      });

    // Test nested heading reference
    const result = await FileExpander.expandFileReferences(
      '![[nested.md#Chapter 1#Section 1.1]]',
      '/base'
    );
    expect(result).toBe('### Section 1.1\nSection content');
    expect(extractNestedSectionSpy).toHaveBeenCalledWith(expect.any(String), [
      'Chapter 1',
      'Section 1.1',
    ]);
  });

  test('should handle circular references', async () => {
    // Mock the file reader to include a circular reference
    (FileReader.readFile as ReturnType<typeof vi.fn>).mockImplementation((path: string) => {
      if (path === '/resolved/file1.md') {
        return Promise.resolve('Content of file1.md with reference to ![[file2.md]]');
      } else if (path === '/resolved/file2.md') {
        return Promise.resolve('Content of file2.md with reference to ![[file1.md]]');
      }
      return Promise.resolve('Default content');
    });

    // Test circular reference detection
    const result = await FileExpander.expandFileReferences('![[file1.md]]', '/base');
    expect(result).toContain('<!-- Circular reference detected:');
  });

  test('should handle file not found errors', async () => {
    // Mock the file resolver to fail
    const resolveFilePathSpy = vi
      .spyOn(FileExpander, 'expandFileReferences')
      .mockRejectedValue(new Error('File not found: missing.md'));

    // Test file not found
    const result = await FileExpander.expandFileReferences('![[missing.md]]', '/base');
    expect(result).toBe('![[missing.md]]'); // Original reference should be preserved
    expect(resolveFilePathSpy).toHaveBeenCalled();
  });

  test('should handle large file errors', async () => {
    // Mock the file reader to throw LargeDataException
    (FileReader.readFile as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('File size exceeds maximum allowed limit')
    );

    // Test large file error
    const result = await FileExpander.expandFileReferences('![[large.md]]', '/base');
    expect(result).toContain('<!-- ');
    expect(result).toContain('exceeds maximum allowed limit');
  });
});
