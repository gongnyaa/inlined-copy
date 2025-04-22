import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import { FileExpanderService } from './FileExpanderService';
import { FileResolverService } from './FileResolverService';
import { LogWrapper } from '../utils/LogWrapper';
import { mockLogWrapper } from '../utils/LogWrapper.mock';
import { mockFileResolverService } from './FileResolverService.mock';
import { LargeDataError, CircularReferenceError } from '../errors/ErrorTypes';
import { VSCodeWrapper } from '../utils';

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
    VSCodeWrapper.SetInstance(mockVSCodeWrapper as any);
    target = FileExpanderService.Instance();

    vi.spyOn(target as any, 'readFileContent').mockImplementation(async function (...args) {
      const filePath = args[0] as string;
      if (filePath === '/test/path/test.txt') return 'File content';
      if (filePath === '/test/path/test1.txt') return 'File content 1';
      if (filePath === '/test/path/test2.txt') return 'File content 2';
      if (filePath === '/test/path/medium.txt') return 'File content';
      return 'Default content';
    });

    vi.spyOn(target as any, 'resolveFilePath').mockImplementation(async function (...args) {
      const filePath = args[0] as string;
      if (filePath === 'missing.txt') {
        throw new Error('ファイルが見つかりません: missing.txt');
      }
      if (filePath === 'large.txt') {
        return '/test/path/large.txt';
      }
      if (filePath === 'error.txt') {
        return '/test/path/error.txt';
      }
      if (filePath === 'circular.txt') {
        return '/test/path/circular.txt';
      }
      return `/test/path/${filePath}`;
    });
  });

  describe('expandFileReferences', () => {
    it('expandFileReferences_Happy', async () => {
      const testText = 'This is a test with ![[test.txt]]';
      const resolvedPath = '/test/path/test.txt';
      const fileContent = 'File content';
      const expectedResult = 'This is a test with File content';

      vi.spyOn(target as any, 'resolveFilePath').mockResolvedValueOnce(resolvedPath);

      (fs.statSync as any).mockReturnValueOnce({ size: 1000 });
      (fs.readFile as any).mockImplementationOnce(
        (path: string, encoding: string, callback: (err: Error | null, data: string) => void) => {
          callback(null, fileContent);
          return undefined as any;
        }
      );

      const result = await target.expandFileReferences(testText, '/test/dir');

      expect(result).toEqual(expectedResult);
      expect(vi.mocked(target as any).resolveFilePath).toHaveBeenCalledWith(
        'test.txt',
        '/test/dir'
      );
    });

    it('expandFileReferences_Happy_MultipleFiles', async () => {
      const testText = 'This is a test with ![[test1.txt]] and ![[test2.txt]]';
      const resolvedPath1 = '/test/path/test1.txt';
      const resolvedPath2 = '/test/path/test2.txt';
      const fileContent1 = 'File content 1';
      const fileContent2 = 'File content 2';
      const expectedResult = 'This is a test with File content 1 and File content 2';

      vi.spyOn(target as any, 'resolveFilePath')
        .mockResolvedValueOnce(resolvedPath1)
        .mockResolvedValueOnce(resolvedPath2);

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
      expect(vi.mocked(target as any).resolveFilePath).toHaveBeenCalledTimes(2);
    });

    it('expandFileReferences_Happy_RecursiveFiles', async () => {
      const testText = 'This is a test with ![[test1.txt]]';
      const nestedText = 'Nested content with ![[test2.txt]]';
      const finalText = 'Final content';
      const resolvedPath1 = '/test/path/test1.txt';
      const resolvedPath2 = '/test/path/test2.txt';
      const expectedResult = 'This is a test with Nested content with Final content';

      vi.spyOn(target as any, 'readFileContent')
        .mockImplementationOnce(async function () {
          return nestedText;
        })
        .mockImplementationOnce(async function () {
          return finalText;
        });

      vi.spyOn(target as any, 'resolveFilePath')
        .mockResolvedValueOnce(resolvedPath1)
        .mockResolvedValueOnce(resolvedPath2);

      (mockFileResolverService.getFilePathInProject as any)
        .mockResolvedValueOnce(resolvedPath1)
        .mockResolvedValueOnce(resolvedPath2);

      const result = await target.expandFileReferences(testText, '/test/dir');

      expect(result).toEqual(expectedResult);
    });

    it('expandFileReferences_Error_FileNotFound', async () => {
      const testText = 'This is a test with ![[missing.txt]]';
      const expectedResult = 'This is a test with ![[missing.txt]]';

      (mockFileResolverService.getFilePathInProject as any).mockRejectedValueOnce(
        new Error('ファイルが見つかりません')
      );

      vi.spyOn(target as any, 'resolveFilePath').mockImplementationOnce(async function () {
        throw new Error('ファイルが見つかりません: missing.txt');
      });

      vi.spyOn(LogWrapper.Instance(), 'log').mockImplementation(vi.fn());

      const result = await target.expandFileReferences(testText, '/test/dir');

      expect(result).toEqual(expectedResult);
      expect(mockLogWrapper.log).toHaveBeenCalled();
    });

    it('expandFileReferences_Error_CircularReference', async () => {
      const testText = 'This is a test with ![[circular.txt]]';
      const resolvedPath = '/test/path/circular.txt';
      const expectedResult = 'This is a test with ![[circular.txt]]';

      (mockFileResolverService.getFilePathInProject as any).mockResolvedValueOnce(resolvedPath);
      (fs.statSync as any).mockReturnValueOnce({ size: 1000 });

      vi.spyOn(target as any, 'readFileContent').mockImplementationOnce(() => {
        throw new CircularReferenceError(`循環参照が検出されました: circular.txt → circular.txt`);
      });

      vi.spyOn(LogWrapper.Instance(), 'error').mockImplementation(vi.fn());

      const result = await target.expandFileReferences(testText, '/test/dir', [resolvedPath]);

      expect(result).toEqual(expectedResult);
      expect(mockLogWrapper.error).toHaveBeenCalled();
    });

    it('expandFileReferences_Error_LargeFile', async () => {
      const testText = 'This is a test with ![[large.txt]]';
      const resolvedPath = '/test/path/large.txt';
      const expectedResult = 'This is a test with ![[large.txt]]';

      (mockFileResolverService.getFilePathInProject as any).mockResolvedValueOnce(resolvedPath);

      vi.spyOn(target as any, 'resolveFilePath').mockImplementationOnce(async function () {
        return resolvedPath;
      });

      vi.spyOn(target as any, 'readFileContent').mockImplementationOnce(async function () {
        throw new LargeDataError(`ファイルサイズ(10.00MB)が許容最大サイズ(5.00MB)を超えています`);
      });

      vi.spyOn(LogWrapper.Instance(), 'log').mockImplementation(vi.fn());

      const result = await target.expandFileReferences(testText, '/test/dir');

      expect(result).toEqual(expectedResult);
      expect(mockLogWrapper.log).toHaveBeenCalled();
    });

    it('expandFileReferences_Error_ReadFileError', async () => {
      const testText = 'This is a test with ![[error.txt]]';
      const resolvedPath = '/test/path/error.txt';
      const expectedResult = 'This is a test with ![[error.txt]]';

      (mockFileResolverService.getFilePathInProject as any).mockResolvedValueOnce({
        path: resolvedPath,
      });
      (fs.statSync as any).mockReturnValueOnce({ size: 1000 });
      (fs.readFile as any).mockImplementationOnce(
        (path: string, encoding: string, callback: (err: Error | null, data: string) => void) => {
          callback(new Error('読み込みエラー'), '');
          return undefined as any;
        }
      );

      vi.spyOn(target as any, 'resolveFilePath').mockImplementationOnce(async function () {
        return resolvedPath;
      });

      vi.spyOn(target as any, 'readFileContent').mockImplementationOnce(async function () {
        throw new Error(`ファイルの読み込みに失敗: 読み込みエラー`);
      });

      vi.spyOn(LogWrapper.Instance(), 'error').mockImplementation(vi.fn());

      const result = await target.expandFileReferences(testText, '/test/dir');

      expect(result).toEqual(expectedResult);
      expect(LogWrapper.Instance().error).toHaveBeenCalled();
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
    beforeEach(() => {
      vi.restoreAllMocks();
      LogWrapper.SetInstance(mockLogWrapper);
      FileResolverService.SetInstance(mockFileResolverService);
      VSCodeWrapper.SetInstance(mockVSCodeWrapper as any);
      target = FileExpanderService.Instance();
    });

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
      // 明示的にモックを再設定
      vi.resetAllMocks();

      // このテスト用の大きなファイルのパス
      const filePath = '/test/path/large.txt';

      // VSCodeWrapperのモックを設定
      (mockVSCodeWrapper.getConfiguration as any).mockReturnValueOnce(5 * 1024 * 1024); // 5MB

      // fs.statSyncが大きなファイルサイズを返すようモック
      (fs.statSync as any).mockReturnValueOnce({ size: 10 * 1024 * 1024 }); // 10MB

      // モック関数をスパイで上書きしないよう注意
      vi.spyOn(target as any, 'readFileContent').mockRestore();

      // エラーがスローされることを確認
      await expect((target as any).readFileContent(filePath)).rejects.toThrow(LargeDataError);
    });

    it('readFileContent_Error_ReadError', async () => {
      // 明示的にモックを再設定
      vi.resetAllMocks();

      const filePath = '/test/path/error.txt';

      // VSCodeWrapperのモックを設定
      (mockVSCodeWrapper.getConfiguration as any).mockReturnValueOnce(5 * 1024 * 1024); // 5MB

      // ファイルサイズは問題ないがreadFileでエラー
      (fs.statSync as any).mockReturnValueOnce({ size: 1000 });
      (fs.readFile as any).mockImplementationOnce(
        (path: string, encoding: string, callback: (err: Error | null, data: string) => void) => {
          callback(new Error('読み込みエラー'), '');
          return undefined as any;
        }
      );

      // モック関数をスパイで上書きしないよう注意
      vi.spyOn(target as any, 'readFileContent').mockRestore();

      // エラーがスローされることを確認
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
