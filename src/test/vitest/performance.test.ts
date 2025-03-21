import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import { FileExpander } from '../../fileExpander';
import { FileReader } from '../../fileReader';
import * as fs from 'fs';
import * as path from 'path';

// Mock VSCode modules
vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: () => ({
      get: () => 5, // Default value for any configuration
    }),
  },
}));

// Mock LogManager to avoid dependency on VSCode
vi.mock('../../utils/logManager', () => ({
  LogManager: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Use real files for performance testing
describe('Performance Tests', () => {
  const testDir = '/tmp/inlined-copy-test';
  const testFile = path.join(testDir, 'test.md');
  const testHeadingFile = path.join(testDir, 'headings.md');

  // Setup test files
  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Create a simple test file
    fs.writeFileSync(testFile, '# Test File\nThis is test content.\n\nMore content here.');

    // Create a file with multiple headings
    const headingContent = [
      '# Main Heading',
      'This is the main content.',
      '',
      '## Section 1',
      'Content for section 1.',
      '',
      '### Subsection 1.1',
      'Content for subsection 1.1.',
      '',
      '### Subsection 1.2',
      'Content for subsection 1.2.',
      '',
      '## Section 2',
      'Content for section 2.',
      '',
      '### Subsection 2.1 {#custom-id}',
      'Content for subsection 2.1 with custom ID.',
      '',
      '## Section 3',
      'Content for section 3.',
    ].join('\n');

    fs.writeFileSync(testHeadingFile, headingContent);
  });

  // Clean up test files
  afterAll(() => {
    try {
      fs.unlinkSync(testFile);
      fs.unlinkSync(testHeadingFile);
      fs.rmdirSync(testDir);
    } catch (error) {
      console.error('Error cleaning up test files:', error);
    }
  });

  test('should efficiently handle multiple references to the same file', async () => {
    // Clear cache before test
    FileReader.clearCache();

    // Create a document with many references to the same file
    let content = '';
    for (let i = 0; i < 10; i++) {
      content += `Reference ${i}: ![[test.md]]\n`;
    }

    // Measure time for first run
    const startTime = process.hrtime();
    await FileExpander.expandFileReferences(content, testDir);
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const milliseconds = seconds * 1000 + nanoseconds / 1000000;

    console.log(`Processed 10 references in ${milliseconds.toFixed(2)}ms`);

    // Test cache by running again
    const startTimeCache = process.hrtime();
    await FileExpander.expandFileReferences(content, testDir);
    const [secondsCache, nanosecondsCache] = process.hrtime(startTimeCache);
    const millisecondsCache = secondsCache * 1000 + nanosecondsCache / 1000000;

    console.log(`Processed 10 references with cache in ${millisecondsCache.toFixed(2)}ms`);

    // Expect cache to be reasonably fast
    expect(millisecondsCache).toBeLessThanOrEqual(milliseconds * 1.5);
  });

  test('should efficiently handle nested heading references', async () => {
    // Clear cache before test
    FileReader.clearCache();

    // Create a document with references to different heading levels
    const content = [
      '![[headings.md#Section 1]]',
      '![[headings.md#Section 1#Subsection 1.1]]',
      '![[headings.md#Section 2#Subsection 2.1]]',
      '![[headings.md#custom-id]]', // Custom ID reference
    ].join('\n\n');

    // Measure time
    const startTime = process.hrtime();
    await FileExpander.expandFileReferences(content, testDir);
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const milliseconds = seconds * 1000 + nanoseconds / 1000000;

    console.log(`Processed nested heading references in ${milliseconds.toFixed(2)}ms`);

    // Run again with cache
    const startTimeCache = process.hrtime();
    await FileExpander.expandFileReferences(content, testDir);
    const [secondsCache, nanosecondsCache] = process.hrtime(startTimeCache);
    const millisecondsCache = secondsCache * 1000 + nanosecondsCache / 1000000;

    console.log(
      `Processed nested heading references with cache in ${millisecondsCache.toFixed(2)}ms`
    );

    // Expect cache to be reasonably fast
    expect(millisecondsCache).toBeLessThanOrEqual(milliseconds * 1.5);
  });

  test('should handle large number of references efficiently', async () => {
    // Clear cache before test
    FileReader.clearCache();

    // Create a document with a large number of references
    let content = '';
    for (let i = 0; i < 50; i++) {
      if (i % 3 === 0) {
        content += `Reference ${i}: ![[test.md]]\n`;
      } else if (i % 3 === 1) {
        content += `Reference ${i}: ![[headings.md#Section ${(i % 3) + 1}]]\n`;
      } else {
        content += `Reference ${i}: ![[headings.md#Section ${(i % 3) + 1}#Subsection ${(i % 2) + 1}.${(i % 2) + 1}]]\n`;
      }
    }

    // Measure time
    const startTime = process.hrtime();
    await FileExpander.expandFileReferences(content, testDir);
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const milliseconds = seconds * 1000 + nanoseconds / 1000000;

    console.log(`Processed 50 mixed references in ${milliseconds.toFixed(2)}ms`);

    // Expect reasonable performance (adjust threshold as needed)
    expect(milliseconds).toBeLessThan(5000); // Should process in under 5 seconds
  });
});
