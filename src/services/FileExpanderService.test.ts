import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import { FileExpanderService, expandSuccess, expandFailure } from './FileExpanderService';
import { FileResolverService, fileSuccess, fileFailure } from './FileResolverService';
import { LogWrapper } from '../utils/LogWrapper';
import { mockLogWrapper } from '../utils/LogWrapper.mock';
import { mockFileResolverService } from './FileResolverService.mock';

vi.mock('fs', () => ({
  readFile: vi.fn(),
}));

describe('FileExpanderService', () => {
  let target: FileExpanderService;

  beforeEach(() => {
    vi.clearAllMocks();
    LogWrapper.SetInstance(mockLogWrapper);
    FileResolverService.SetInstance(mockFileResolverService);
    target = new FileExpanderService();
  });

  describe('expandFiles', () => {
    it('expandFiles_Happy', async () => {
      const testText = 'This is a test with [file:test.txt]';
      const resolvedPath = '/test/path/test.txt';
      const fileContent = 'File content';
      const expectedResult = 'This is a test with File content';

      (mockFileResolverService.resolveFilePath as any).mockResolvedValueOnce(fileSuccess(resolvedPath));
      
      (fs.readFile as any).mockImplementation((_: any, __: any, callback: any) => {
        if (typeof __ === 'function') {
          __(null, fileContent);
        } else if (callback) {
          callback(null, fileContent);
        }
      });

      const result = await target.expandFiles(testText, '/test/dir');

      expect(result).toEqual(expandSuccess(expectedResult));
      expect(mockFileResolverService.resolveFilePath).toHaveBeenCalledWith('test.txt', '/test/dir');
    });

    it('expandFiles_Happy_MultipleFiles', async () => {
      const testText = 'This is a test with [file:test1.txt] and [file:test2.txt]';
      const resolvedPath1 = '/test/path/test1.txt';
      const resolvedPath2 = '/test/path/test2.txt';
      const fileContent1 = 'File content 1';
      const fileContent2 = 'File content 2';
      const expectedResult = 'This is a test with File content 1 and File content 2';

      (mockFileResolverService.resolveFilePath as any)
        .mockResolvedValueOnce(fileSuccess(resolvedPath1))
        .mockResolvedValueOnce(fileSuccess(resolvedPath2));

      (fs.readFile as any)
        .mockImplementationOnce((_: any, __: any, callback: any) => {
          if (typeof __ === 'function') {
            __(null, fileContent1);
          } else if (callback) {
            callback(null, fileContent1);
          }
        })
        .mockImplementationOnce((_: any, __: any, callback: any) => {
          if (typeof __ === 'function') {
            __(null, fileContent2);
          } else if (callback) {
            callback(null, fileContent2);
          }
        });

      const result = await target.expandFiles(testText, '/test/dir');

      expect(result).toEqual(expandSuccess(expectedResult));
      expect(mockFileResolverService.resolveFilePath).toHaveBeenCalledTimes(2);
    });

    it('expandFiles_Error_FileNotFound', async () => {
      const testText = 'This is a test with [file:missing.txt]';
      const expectedResult = 'This is a test with [ファイルが見つかりません: missing.txt]';

      (mockFileResolverService.resolveFilePath as any).mockResolvedValueOnce(fileFailure('ファイルが見つかりません'));
      (mockFileResolverService.getSuggestions as any).mockResolvedValueOnce([]);

      const result = await target.expandFiles(testText, '/test/dir');

      expect(result).toEqual(expandSuccess(expectedResult));
      expect(mockLogWrapper.warn).toHaveBeenCalled();
    });

    it('expandFiles_Error_ReadFileError', async () => {
      const testText = 'This is a test with [file:error.txt]';
      const resolvedPath = '/test/path/error.txt';
      const expectedResult = 'This is a test with [ファイルが見つかりません: error.txt]';

      (mockFileResolverService.resolveFilePath as any).mockResolvedValueOnce(fileSuccess(resolvedPath));
      
      (fs.readFile as any).mockImplementation((_: any, __: any, callback: any) => {
        if (typeof __ === 'function') {
          __(new Error('読み込みエラー'), '');
        } else if (callback) {
          callback(new Error('読み込みエラー'), '');
        }
      });

      const result = await target.expandFiles(testText, '/test/dir');

      expect(result).toEqual(expandSuccess(expectedResult));
      expect(mockLogWrapper.warn).toHaveBeenCalled();
    });

    it('expandFiles_Error_UnexpectedException', async () => {
      const testText = 'This is a test with [file:test.txt]';
      const testError = new Error('予期せぬエラー');

      const originalExec = RegExp.prototype.exec;
      RegExp.prototype.exec = vi.fn().mockImplementationOnce(() => {
        throw testError;
      });

      const result = await target.expandFiles(testText, '/test/dir');

      RegExp.prototype.exec = originalExec;

      expect(result).toEqual(expandFailure('エラー: 予期せぬエラー'));
      expect(mockLogWrapper.error).toHaveBeenCalledWith('展開処理エラー: Error: 予期せぬエラー');
    });
  });
});
