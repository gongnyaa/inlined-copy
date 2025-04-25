import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileResolverService } from './FileResolverService';
import { FileSearchService } from './FileSearchService';
import { LogWrapper } from '../utils';
import { ValidPath } from '../types/ValidPath';
import { createMockValidPath } from '../types/ValidPath.mock';

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

// ValidPathをモック
vi.mock('../types/ValidPath', () => {
  return {
    ValidPath: class MockValidPath {
      value: string;
      constructor(path: string) {
        this.value = path;
      }
      isInWorkspace() {
        return true;
      }
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

      mockFileSearchService.hasInBase.mockImplementation(
        (validFilePath: ValidPath, validBasePath: ValidPath) => {
          return Promise.resolve(
            validFilePath.value === filePath && validBasePath.value === basePath
          );
        }
      );
      mockFileSearchService.findFileInBase.mockResolvedValueOnce(expectedPath);

      const result = await target.getFilePathInProject(filePath, basePath);

      expect(result).toEqual(expectedPath);
      expect(mockFileSearchService.hasInBase).toHaveBeenCalled();
      expect(mockFileSearchService.findFileInBase).toHaveBeenCalled();
    });

    it('getFilePathInProject_HappyPath_親ディレクトリ検索で見つかる場合', async () => {
      const filePath = 'test.ts';
      const basePath = '/workspace/root/src/components';
      const parentPath = '/workspace/root/src';
      const expectedPath = '/workspace/root/src/test.ts';

      mockFileSearchService.isInProject.mockImplementation(
        (validPath: ValidPath) => validPath.value === basePath || validPath.value === parentPath
      );

      mockFileSearchService.hasInBase.mockImplementation(
        (validFilePath: ValidPath, validBasePath: ValidPath) => {
          if (validBasePath.value === basePath) {
            return Promise.resolve(false);
          } else if (validBasePath.value === parentPath) {
            return Promise.resolve(true);
          }
          return Promise.resolve(false);
        }
      );

      mockFileSearchService.findParent.mockResolvedValueOnce(parentPath);
      mockFileSearchService.findFileInBase.mockResolvedValueOnce(expectedPath);

      const result = await target.getFilePathInProject(filePath, basePath);

      expect(result).toEqual(expectedPath);
      expect(mockFileSearchService.hasInBase).toHaveBeenCalledTimes(2);
      expect(mockFileSearchService.findParent).toHaveBeenCalled();
      expect(mockFileSearchService.findFileInBase).toHaveBeenCalled();
    });

    it('getFilePathInProject_Error_ファイルが見つからない場合', async () => {
      const filePath = 'test.ts';
      const basePath = '/workspace/root/src';
      const parentPath = '/workspace/root';

      mockFileSearchService.isInProject.mockImplementation(
        (validPath: ValidPath) => validPath.value === basePath
      );

      mockFileSearchService.hasInBase.mockResolvedValue(false);
      mockFileSearchService.findParent.mockResolvedValueOnce(parentPath);

      await expect(target.getFilePathInProject(filePath, basePath)).rejects.toThrow(
        `ファイルが見つかりません: ${filePath}`
      );

      expect(mockFileSearchService.hasInBase).toHaveBeenCalled();
      expect(mockFileSearchService.findParent).toHaveBeenCalled();
    });

    it('getFilePathInProject_Error_ワークスペース外のパスが指定された場合', async () => {
      const filePath = 'test.ts';
      const basePath = '/outside/workspace';

      mockFileSearchService.isInProject.mockImplementation((validPath: ValidPath) => false);

      await expect(target.getFilePathInProject(filePath, basePath)).rejects.toThrow(
        `ファイルが見つかりません: ${filePath}`
      );

      expect(mockFileSearchService.isInProject).toHaveBeenCalled();
    });
  });
});
