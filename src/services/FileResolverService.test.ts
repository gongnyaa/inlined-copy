import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileResolverService } from './FileResolverService';
import { FileSearchService } from './FileSearchService';
import { LogWrapper } from '../utils';

// FileSearchServiceをモック
vi.mock('./FileSearchService', () => {
  return {
    FileSearchService: {
      Instance: vi.fn().mockReturnValue({
        findFileInBase: vi.fn(),
        findParent: vi.fn(),
      }),
    },
  };
});

// VSCodeのAPIをモック
vi.mock('vscode', () => {
  return {
    workspace: {
      findFiles: vi.fn(),
      asRelativePath: vi.fn((uri: any) => {
        if (typeof uri === 'string') return uri;
        return uri.fsPath.replace('/workspace/root/', '');
      }),
    },
  };
});

describe('FileResolverService', () => {
  let target: FileResolverService;
  let mockFileSearchService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    target = FileResolverService.Instance();
    mockFileSearchService = FileSearchService.Instance();
    vi.spyOn(LogWrapper.Instance(), 'error').mockImplementation(() => {});
  });

  describe('resolveFilePath', () => {
    it('resolveFilePath_HappyPath_ファイルが最初に見つかる場合', async () => {
      // Arrange
      const filePath = 'test.ts';
      const basePath = '/workspace/root/src';
      const expectedPath = '/workspace/root/src/test.ts';
      mockFileSearchService.findFileInBase.mockResolvedValueOnce({
        path: expectedPath,
      });

      // Act
      const result = await target.resolveFilePath(filePath, basePath);

      // Assert
      expect(mockFileSearchService.findFileInBase).toHaveBeenCalledWith(filePath, basePath);
      expect(result).toEqual(expectedPath);
    });

    it('resolveFilePath_HappyPath_親ディレクトリ検索で見つかる場合', async () => {
      // Arrange
      const filePath = 'test.ts';
      const basePath = '/workspace/root/src/components';
      const parentPath = '/workspace/root/src';
      const expectedPath = '/workspace/root/src/test.ts';

      // 最初の検索は失敗
      mockFileSearchService.findFileInBase.mockResolvedValueOnce({
        error: 'ファイルが見つかりません: test.ts',
      });

      // 親ディレクトリの取得
      mockFileSearchService.findParent.mockResolvedValueOnce({
        path: parentPath,
      });

      // 親ディレクトリでの検索は成功
      mockFileSearchService.findFileInBase.mockResolvedValueOnce({
        path: expectedPath,
      });

      // Act
      const result = await target.resolveFilePath(filePath, basePath);

      // Assert
      expect(mockFileSearchService.findFileInBase).toHaveBeenCalledWith(filePath, basePath);
      expect(mockFileSearchService.findParent).toHaveBeenCalledWith(basePath);
      expect(mockFileSearchService.findFileInBase).toHaveBeenCalledWith(filePath, parentPath);
      expect(result).toEqual(expectedPath);
    });

    it('resolveFilePath_Error_親ディレクトリの取得に失敗する場合', async () => {
      // Arrange
      const filePath = 'test.ts';
      const basePath = '/workspace/root/src';

      // ファイル検索失敗
      mockFileSearchService.findFileInBase.mockResolvedValueOnce({
        error: 'ファイルが見つかりません: test.ts',
      });

      // 親ディレクトリ取得失敗
      mockFileSearchService.findParent.mockResolvedValueOnce({
        error: 'ワークスペース外のパスが検出されました',
      });

      // Act & Assert
      await expect(target.resolveFilePath(filePath, basePath)).rejects.toThrow(
        'ファイルが見つかりません: test.ts'
      );
    });

    it('resolveFilePath_Error_予期せぬエラーの場合', async () => {
      // Arrange
      const filePath = 'test.ts';
      const basePath = '/workspace/root/src';

      // ファイル検索で予期せぬエラー（pathもerrorもない）
      mockFileSearchService.findFileInBase.mockResolvedValueOnce({});

      // Act & Assert
      await expect(target.resolveFilePath(filePath, basePath)).rejects.toThrow(
        `予期せぬエラー: ファイルパスが取得できませんでした - ${filePath}`
      );
    });

    it('resolveFilePath_Error_親ディレクトリのパスが取得できない場合', async () => {
      // Arrange
      const filePath = 'test.ts';
      const basePath = '/workspace/root/src';

      // ファイル検索失敗
      mockFileSearchService.findFileInBase.mockResolvedValueOnce({
        error: 'ファイルが見つかりません: test.ts',
      });

      // 親ディレクトリ取得で予期せぬエラー（pathもerrorもない）
      mockFileSearchService.findParent.mockResolvedValueOnce({});

      // Act & Assert
      await expect(target.resolveFilePath(filePath, basePath)).rejects.toThrow(
        `予期せぬエラー: 親ディレクトリのパスが取得できませんでした - ${basePath}`
      );
    });
  });
});
