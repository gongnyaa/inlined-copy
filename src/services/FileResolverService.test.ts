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
        isInProject: vi.fn(),
        hasInBase: vi.fn(),
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

    // デフォルトのモック動作を設定
    mockFileSearchService.isInProject
      .mockReturnValueOnce(true) // 最初の呼び出しでtrue
      .mockReturnValue(false); // 以降の呼び出しでfalse
    mockFileSearchService.hasInBase.mockResolvedValue(false);
  });

  describe('getFilePathInProject', () => {
    it('getFilePathInProject_HappyPath_ファイルが最初に見つかる場合', async () => {
      const filePath = 'test.ts';
      const basePath = '/workspace/root/src';
      const expectedPath = '/workspace/root/src/test.ts';

      mockFileSearchService.hasInBase.mockResolvedValueOnce(true);
      mockFileSearchService.findFileInBase.mockResolvedValueOnce(expectedPath);

      const result = await target.getFilePathInProject(filePath, basePath);

      expect(result).toEqual(expectedPath);
      expect(mockFileSearchService.hasInBase).toHaveBeenCalledWith(filePath, basePath);
      expect(mockFileSearchService.findFileInBase).toHaveBeenCalledWith(filePath, basePath);
    });

    it('getFilePathInProject_HappyPath_親ディレクトリ検索で見つかる場合', async () => {
      const filePath = 'test.ts';
      const basePath = '/workspace/root/src/components';
      const parentPath = '/workspace/root/src';
      const expectedPath = '/workspace/root/src/test.ts';

      mockFileSearchService.isInProject
        .mockReturnValueOnce(true) // 最初のパス
        .mockReturnValueOnce(true) // 親ディレクトリ
        .mockReturnValue(false); // それ以降

      mockFileSearchService.hasInBase
        .mockResolvedValueOnce(false) // 最初のパスで見つからない
        .mockResolvedValueOnce(true); // 親ディレクトリで見つかる

      mockFileSearchService.findParent.mockResolvedValueOnce(parentPath);
      mockFileSearchService.findFileInBase.mockResolvedValueOnce(expectedPath);

      const result = await target.getFilePathInProject(filePath, basePath);

      expect(result).toEqual(expectedPath);
      expect(mockFileSearchService.hasInBase).toHaveBeenCalledWith(filePath, basePath);
      expect(mockFileSearchService.findParent).toHaveBeenCalledWith(basePath);
      expect(mockFileSearchService.hasInBase).toHaveBeenCalledWith(filePath, parentPath);
      expect(mockFileSearchService.findFileInBase).toHaveBeenCalledWith(filePath, parentPath);
    });

    it('getFilePathInProject_Error_ファイルが見つからない場合', async () => {
      const filePath = 'test.ts';
      const basePath = '/workspace/root/src';
      const parentPath = '/workspace/root';

      mockFileSearchService.isInProject
        .mockReturnValueOnce(true) // 最初のパス
        .mockReturnValue(false); // 親ディレクトリ以降

      mockFileSearchService.hasInBase.mockResolvedValue(false);
      mockFileSearchService.findParent.mockResolvedValueOnce(parentPath);

      await expect(target.getFilePathInProject(filePath, basePath)).rejects.toThrow(
        `ファイルが見つかりません: ${filePath}`
      );

      expect(mockFileSearchService.hasInBase).toHaveBeenCalledWith(filePath, basePath);
      expect(mockFileSearchService.findParent).toHaveBeenCalledWith(basePath);
    });

    it('getFilePathInProject_Error_ワークスペース外のパスが指定された場合', async () => {
      const filePath = 'test.ts';
      const basePath = '/outside/workspace';

      mockFileSearchService.isInProject.mockReturnValue(false);

      await expect(target.getFilePathInProject(filePath, basePath)).rejects.toThrow(
        `ファイルが見つかりません: ${filePath}`
      );

      expect(mockFileSearchService.isInProject).toHaveBeenCalledWith(basePath);
    });
  });
});
