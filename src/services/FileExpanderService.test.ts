import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import { FileExpanderService } from './FileExpanderService';
import { FileResolverService, fileSuccess, fileFailure } from './FileResolverService';
import { LogWrapper } from '../utils/LogWrapper';
import { mockLogWrapper } from '../utils/LogWrapper.mock';
import { mockFileResolverService } from './FileResolverService.mock';
import { LargeDataException, CircularReferenceException } from '../errors/ErrorTypes';

vi.mock('fs', () => ({
  readFile: vi.fn(),
  statSync: vi.fn(),
  createReadStream: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
  })),
}));

vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: vi.fn().mockReturnValue({
      get: vi.fn(),
    }),
  },
}));

describe('FileExpanderService', () => {
  let target: FileExpanderService;
  const mockVSCodeWrapper = {
    getConfiguration: vi.fn().mockReturnValue(1),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    LogWrapper.SetInstance(mockLogWrapper);
    FileResolverService.SetInstance(mockFileResolverService);
    target = new FileExpanderService(mockVSCodeWrapper as any);
  });

  describe('expandFileReferences', () => {
    it('expandFileReferences_Happy', async () => {
      const testText = 'This is a test with ![[test.txt]]';
      const resolvedPath = '/test/path/test.txt';
      const fileContent = 'File content';
      const expectedResult = 'This is a test with File content';

      (mockFileResolverService.resolveFilePath as any).mockResolvedValueOnce(
        fileSuccess(resolvedPath)
      );
      (fs.statSync as any).mockReturnValueOnce({ size: 1000 });
      (fs.readFile as any).mockImplementationOnce(
        (path: string, encoding: string, callback: (err: Error | null, data: string) => void) => {
          callback(null, fileContent);
          return undefined as any;
        }
      );

      const result = await target.expandFileReferences(testText, '/test/dir');

      expect(result).toEqual(expectedResult);
      expect(mockFileResolverService.resolveFilePath).toHaveBeenCalledWith('test.txt', '/test/dir');
    });

    it('expandFileReferences_Happy_MultipleFiles', async () => {
      const testText = 'This is a test with ![[test1.txt]] and ![[test2.txt]]';
      const resolvedPath1 = '/test/path/test1.txt';
      const resolvedPath2 = '/test/path/test2.txt';
      const fileContent1 = 'File content 1';
      const fileContent2 = 'File content 2';
      const expectedResult = 'This is a test with File content 1 and File content 2';

      (mockFileResolverService.resolveFilePath as any)
        .mockResolvedValueOnce(fileSuccess(resolvedPath1))
        .mockResolvedValueOnce(fileSuccess(resolvedPath2));

      (fs.statSync as any).mockReturnValueOnce({ size: 1000 }).mockReturnValueOnce({ size: 1000 });

      (fs.readFile as any)
        .mockImplementationOnce(
          (path: string, encoding: string, callback: (err: Error | null, data: string) => void) => {
            callback(null, fileContent1);
            return undefined as any;
          }
        )
        .mockImplementationOnce(
          (path: string, encoding: string, callback: (err: Error | null, data: string) => void) => {
            callback(null, fileContent2);
            return undefined as any;
          }
        );

      const result = await target.expandFileReferences(testText, '/test/dir');

      expect(result).toEqual(expectedResult);
      expect(mockFileResolverService.resolveFilePath).toHaveBeenCalledTimes(2);
    });

    it('expandFileReferences_Happy_RecursiveFiles', async () => {
      const testText = 'This is a test with ![[test1.txt]]';
      const nestedText = 'Nested content with ![[test2.txt]]';
      const finalText = 'Final content';
      const resolvedPath1 = '/test/path/test1.txt';
      const resolvedPath2 = '/test/path/test2.txt';
      const expectedResult = 'This is a test with Nested content with Final content';

      (mockFileResolverService.resolveFilePath as any)
        .mockResolvedValueOnce(fileSuccess(resolvedPath1))
        .mockResolvedValueOnce(fileSuccess(resolvedPath2));

      (fs.statSync as any).mockReturnValueOnce({ size: 1000 }).mockReturnValueOnce({ size: 1000 });

      (fs.readFile as any)
        .mockImplementationOnce(
          (path: string, encoding: string, callback: (err: Error | null, data: string) => void) => {
            callback(null, nestedText);
            return undefined as any;
          }
        )
        .mockImplementationOnce(
          (path: string, encoding: string, callback: (err: Error | null, data: string) => void) => {
            callback(null, finalText);
            return undefined as any;
          }
        );

      const result = await target.expandFileReferences(testText, '/test/dir');

      expect(result).toEqual(expectedResult);
    });

    it('expandFileReferences_Error_FileNotFound', async () => {
      const testText = 'This is a test with ![[missing.txt]]';
      const expectedResult = 'This is a test with ![[missing.txt]]';

      (mockFileResolverService.resolveFilePath as any).mockResolvedValueOnce(
        fileFailure('ファイルが見つかりません')
      );
      (mockFileResolverService.getSuggestions as any).mockResolvedValueOnce([]);

      const result = await target.expandFileReferences(testText, '/test/dir');

      expect(result).toEqual(expectedResult);
      expect(mockLogWrapper.log).toHaveBeenCalled();
    });

    it('expandFileReferences_Error_CircularReference', async () => {
      const testText = 'This is a test with ![[circular.txt]]';
      const resolvedPath = '/test/path/circular.txt';
      const expectedResult = 'This is a test with ![[circular.txt]]';

      (mockFileResolverService.resolveFilePath as any).mockResolvedValueOnce(
        fileSuccess(resolvedPath)
      );
      (fs.statSync as any).mockReturnValueOnce({ size: 1000 });

      const result = await target.expandFileReferences(testText, '/test/dir', [resolvedPath]);

      expect(result).toEqual(expectedResult);
      expect(mockLogWrapper.error).toHaveBeenCalled();
    });

    it('expandFileReferences_Error_LargeFile', async () => {
      const testText = 'This is a test with ![[large.txt]]';
      const resolvedPath = '/test/path/large.txt';
      const expectedResult = 'This is a test with ![[large.txt]]';

      (mockFileResolverService.resolveFilePath as any).mockResolvedValueOnce(
        fileSuccess(resolvedPath)
      );
      (fs.statSync as any).mockReturnValueOnce({ size: 10 * 1024 * 1024 }); // 10MB
      mockVSCodeWrapper.getConfiguration.mockReturnValueOnce(5 * 1024 * 1024); // 5MB

      const result = await target.expandFileReferences(testText, '/test/dir');

      expect(result).toEqual(expectedResult);
      expect(mockLogWrapper.log).toHaveBeenCalled();
    });

    it('expandFileReferences_Error_ReadFileError', async () => {
      const testText = 'This is a test with ![[error.txt]]';
      const resolvedPath = '/test/path/error.txt';
      const expectedResult = 'This is a test with ![[error.txt]]';

      (mockFileResolverService.resolveFilePath as any).mockResolvedValueOnce(
        fileSuccess(resolvedPath)
      );
      (fs.statSync as any).mockReturnValueOnce({ size: 1000 });
      (fs.readFile as any).mockImplementationOnce(
        (path: string, encoding: string, callback: (err: Error | null, data: string) => void) => {
          callback(new Error('読み込みエラー'), '');
          return undefined as any;
        }
      );

      const result = await target.expandFileReferences(testText, '/test/dir');

      expect(result).toEqual(expectedResult);
      expect(mockLogWrapper.error).toHaveBeenCalled();
    });

    it('expandFileReferences_MaxRecursionDepth', async () => {
      const testText = 'This is a test with ![[test.txt]]';
      const expectedResult = 'This is a test with ![[test.txt]]';

      mockVSCodeWrapper.getConfiguration.mockReturnValueOnce(1); // maxRecursionDepth = 1

      const result = await target.expandFileReferences(testText, '/test/dir', [], 2);

      expect(result).toEqual(expectedResult);
      expect(mockLogWrapper.log).toHaveBeenCalled();
    });
  });

  describe('readFileContent', () => {
    it('readFileContent_Happy', async () => {
      const filePath = '/test/path/test.txt';
      const fileContent = 'File content';

      (fs.statSync as any).mockReturnValueOnce({ size: 1000 });
      (fs.readFile as any).mockImplementationOnce(
        (path: string, encoding: string, callback: (err: Error | null, data: string) => void) => {
          callback(null, fileContent);
          return undefined as any;
        }
      );

      const result = await (target as any).readFileContent(filePath);

      expect(result).toEqual(fileContent);
    });

    it('readFileContent_Error_LargeFile', async () => {
      const filePath = '/test/path/large.txt';

      (fs.statSync as any).mockReturnValueOnce({ size: 10 * 1024 * 1024 }); // 10MB
      mockVSCodeWrapper.getConfiguration.mockReturnValueOnce(5 * 1024 * 1024); // 5MB

      await expect((target as any).readFileContent(filePath)).rejects.toThrow(LargeDataException);
    });

    it('readFileContent_Error_ReadError', async () => {
      const filePath = '/test/path/error.txt';

      (fs.statSync as any).mockReturnValueOnce({ size: 1000 });
      (fs.readFile as any).mockImplementationOnce(
        (path: string, encoding: string, callback: (err: Error | null, data: string) => void) => {
          callback(new Error('読み込みエラー'), '');
          return undefined as any;
        }
      );

      await expect((target as any).readFileContent(filePath)).rejects.toThrow(
        'ファイルの読み込みに失敗'
      );
    });

    it('readFileContent_Happy_StreamingForLargerFiles', async () => {
      const filePath = '/test/path/medium.txt';
      const fileContent = 'File content';

      (fs.statSync as any).mockReturnValueOnce({ size: 3 * 1024 * 1024 }); // 3MB
      mockVSCodeWrapper.getConfiguration.mockReturnValueOnce(5 * 1024 * 1024); // 5MB

      const mockStream: { on: ReturnType<typeof vi.fn> } = {
        on: vi.fn().mockImplementation((event, callback) => {
          if (event === 'end') {
            callback();
          }
          return mockStream;
        }),
      };

      (fs.createReadStream as any).mockReturnValueOnce(mockStream);

      const originalConcat = Buffer.concat;
      Buffer.concat = vi.fn().mockReturnValue({
        toString: vi.fn().mockReturnValue(fileContent),
      });

      const result = await (target as any).readFileContentStreaming(filePath);

      Buffer.concat = originalConcat;

      expect(result).toEqual(fileContent);
      expect(fs.createReadStream).toHaveBeenCalledWith(filePath);
    });
  });
});
