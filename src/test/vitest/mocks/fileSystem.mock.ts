import { vi } from 'vitest';
import * as fs from 'fs';

/**
 * Options for file system mock configuration
 */
interface FileSystemMockOptions {
  fileSize?: number;
  fileContent?: string;
  getFileSize?: (filePath: string) => number | undefined;
  getFileContent?: (filePath: string) => string | undefined;
}

/**
 * Sets up file system mocks with configurable behavior
 * @param options Configuration options for the mock
 * @returns A configured FileSystem mock with restore method
 */
export function setupFileSystemMock(options: FileSystemMockOptions = {}): { restore: () => void } {
  const defaultOptions = {
    fileSize: 1024,
    fileContent: 'Mock file content',
    ...options,
  };

  // Mock fs.statSync
  vi.spyOn(fs, 'statSync').mockImplementation(filePath => {
    const pathStr = filePath.toString();

    // Custom conditions take priority
    if (typeof options.getFileSize === 'function') {
      const size = options.getFileSize(pathStr);
      if (size !== undefined) {
        return { size } as fs.Stats;
      }
    }

    // Return default size
    return { size: defaultOptions.fileSize } as fs.Stats;
  });

  // Mock fs.readFile
  vi.spyOn(fs, 'readFile').mockImplementation((...args) => {
    // Get callback function (last argument)
    const callback = args[args.length - 1] as (
      err: NodeJS.ErrnoException | null,
      data: Buffer | string
    ) => void;
    const filePath = args[0].toString();

    // Custom content function takes priority
    if (typeof options.getFileContent === 'function') {
      const content = options.getFileContent(filePath);
      if (content !== undefined) {
        callback(null, content);
        return undefined;
      }
    }

    // Return default content
    callback(null, defaultOptions.fileContent);
    return undefined;
  });

  // Mock fs.existsSync
  vi.spyOn(fs, 'existsSync').mockReturnValue(true);

  // Mock fs.mkdirSync
  vi.spyOn(fs, 'mkdirSync').mockImplementation(() => undefined);

  // Mock fs.writeFileSync
  vi.spyOn(fs, 'writeFileSync').mockImplementation(() => undefined);

  return {
    restore: () => {
      vi.restoreAllMocks();
    },
  };
}
