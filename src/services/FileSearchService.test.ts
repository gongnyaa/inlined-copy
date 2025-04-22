import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileSearchService } from './FileSearchService';
import { FileSearchError } from '../errors/ErrorTypes';
import { LogWrapper } from '../utils/LogWrapper';
import { mockLogWrapper } from '../utils/LogWrapper.mock';
import { PathInfo, PathWrapper, VSCodeWrapper } from '../utils';

// VSCodeWrapperのモック
vi.mock('../utils/VSCodeWrapper', () => ({
  VSCodeWrapper: {
    Instance: vi.fn().mockReturnValue({
      getWorkspaceRootPath: vi.fn().mockReturnValue('/workspace'),
      findFiles: vi.fn(),
      createUri: vi.fn().mockImplementation(path => ({ fsPath: path })),
      createRelativePattern: vi.fn().mockImplementation((_, pattern) => pattern),
    }),
  },
}));

// PathWrapperのモック
vi.mock('../utils/PathWrapper', () => {
  // 実際のPathInfoクラスをモックで使用するためのモック実装
  class MockPathInfo {
    hasExtension = true;
    hasParentFolder = false;
    parentFolder = '';
    baseSearchPattern = '';

    constructor(filePath: string) {
      // テストケースに応じて値を設定
      if (filePath.includes('/')) {
        this.hasParentFolder = true;
        this.parentFolder = filePath.substring(0, filePath.lastIndexOf('/'));
      }
      this.baseSearchPattern = filePath.substring(filePath.lastIndexOf('/') + 1);
    }

    buildSearchPattern(relativeBase: string, wildcardPattern: string): string {
      if (this.hasParentFolder) {
        return `${relativeBase}/${this.parentFolder}/${this.baseSearchPattern}`;
      }
      return `${relativeBase}/${wildcardPattern}/${this.baseSearchPattern}`;
    }
  }

  return {
    PathInfo: MockPathInfo,
    PathWrapper: {
      Instance: vi.fn().mockReturnValue({
        createPathInfo: vi.fn().mockImplementation(filePath => new MockPathInfo(filePath)),
        normalize: vi.fn().mockImplementation(path => path),
        relative: vi.fn().mockImplementation((from, to) => to.replace(from + '/', '')),
        dirname: vi.fn().mockImplementation(path => {
          // ルートディレクトリの場合は'/'を返す
          if (path === '/workspace') return '/';
          const lastSlashIndex = path.lastIndexOf('/');
          return lastSlashIndex !== -1 ? path.substring(0, lastSlashIndex) : '/';
        }),
        basename: vi.fn().mockImplementation(path => {
          const lastSlashIndex = path.lastIndexOf('/');
          return lastSlashIndex !== -1 ? path.substring(lastSlashIndex + 1) : path;
        }),
        join: vi.fn().mockImplementation((...paths) => paths.join('/')),
        // 新しく追加したメソッドのモック
        isPathInside: vi.fn().mockImplementation((checkPath, basePath) => {
          // /workspaceで始まるパスはワークスペース内と判定
          return checkPath.startsWith('/workspace');
        }),
        createSearchPattern: vi
          .fn()
          .mockImplementation((relativeBase, fileName, wildcardPattern = '**') => {
            const pathInfo = new MockPathInfo(fileName);
            return pathInfo.buildSearchPattern(relativeBase, wildcardPattern);
          }),
        filterMatchingFile: vi.fn().mockImplementation((files: string[], pathInfo) => {
          if (files.length === 0) return null;
          if (!pathInfo.hasParentFolder) return files[0];

          const matchingFile = files.find((file: string) => {
            const fileDir = file.substring(0, file.lastIndexOf('/'));
            return fileDir.endsWith(pathInfo.parentFolder);
          });

          return matchingFile || null;
        }),
        findFileInWorkspace: vi
          .fn()
          .mockImplementation(
            async (workspaceRoot, basePath, filePath, excludePattern, maxResults) => {
              // ワークスペース外のパスの場合はエラーを投げる
              if (!basePath.startsWith('/workspace')) {
                throw new FileSearchError('OutsideWorkspace', 'path_outside_workspace');
              }

              // テストケースに応じて結果を返す
              if (filePath === 'missing.ts') {
                return null;
              }

              return `${basePath}/${filePath}`;
            }
          ),
      }),
    },
  };
});

describe('FileSearchService', () => {
  let target: FileSearchService;

  beforeEach(() => {
    vi.clearAllMocks();
    LogWrapper.SetInstance(mockLogWrapper);
    target = FileSearchService.Instance();
  });

  describe('findFileInBase', () => {
    it('findFileInBase_Happy_ファイルが見つかる場合', async () => {
      const filePath = 'test.ts';
      const basePath = '/workspace/root/src';
      const expectedPath = '/workspace/root/src/test.ts';

      (VSCodeWrapper.Instance().findFiles as any).mockResolvedValueOnce([{ fsPath: expectedPath }]);

      const result = await target.findFileInBase(filePath, basePath);
      expect(result).toBe(expectedPath);
    });

    it('findFileInBase_Error_ファイルが見つからない場合', async () => {
      const filePath = 'missing.ts';
      const basePath = '/workspace/root/src';

      (VSCodeWrapper.Instance().findFiles as any).mockResolvedValueOnce([]);

      try {
        await target.findFileInBase(filePath, basePath);
        // ここに到達した場合はテスト失敗
        expect(true).toBe(false); // エラーが発生すべき
      } catch (error) {
        expect(error).toBeInstanceOf(FileSearchError);
        expect((error as FileSearchError).type).toBe('NotFound');
      }
    });

    it('findFileInBase_Error_ワークスペース外のパスが指定された場合', async () => {
      const filePath = 'test.ts';
      const basePath = '/outside/workspace';

      // パスがワークスペース外であることをシミュレート
      (VSCodeWrapper.Instance().getWorkspaceRootPath as any).mockReturnValue('/workspace');

      try {
        await target.findFileInBase(filePath, basePath);
        // ここに到達した場合はテスト失敗
        expect(true).toBe(false); // エラーが発生すべき
      } catch (error) {
        expect(error).toBeInstanceOf(FileSearchError);
        expect((error as FileSearchError).type).toBe('OutsideWorkspace');
      }
    });
  });

  describe('findParent', () => {
    it('指定されたパスの親ディレクトリを返す', async () => {
      const result = await target.findParent('/workspace/test/path');
      expect(result).toBe('/workspace/test');
    });

    it('ワークスペース外のパスが指定された場合はエラーを投げる', async () => {
      // パスがワークスペース外であることをシミュレート
      (VSCodeWrapper.Instance().getWorkspaceRootPath as any).mockReturnValue('/workspace');

      try {
        await target.findParent('/outside/workspace');
        // ここに到達した場合はテスト失敗
        expect(true).toBe(false); // エラーが発生すべき
      } catch (error) {
        expect(error).toBeInstanceOf(FileSearchError);
        expect((error as FileSearchError).type).toBe('OutsideWorkspace');
      }
    });

    it('ワークスペースルートの場合は親ディレクトリを返す', async () => {
      const result = await target.findParent('/workspace');
      expect(result).toBe('/');
    });
  });

  describe('isInProject', () => {
    it('isInProject_True_プロジェクト内のパスの場合', () => {
      const checkPath = '/workspace/root/src';
      expect(target.isInProject(checkPath)).toBe(true);
    });

    it('isInProject_False_プロジェクト外のパスの場合', () => {
      const checkPath = '/outside/workspace';
      expect(target.isInProject(checkPath)).toBe(false);
    });
  });

  describe('hasInBase', () => {
    it('hasInBase_True_ファイルが指定のベースパスにある場合', async () => {
      const filePath = 'test.ts';
      const basePath = '/workspace/root/src';

      (VSCodeWrapper.Instance().findFiles as any).mockResolvedValueOnce([
        { fsPath: '/workspace/root/src/test.ts' },
      ]);

      const result = await target.hasInBase(filePath, basePath);
      expect(result).toBe(true);
    });

    it('hasInBase_False_ファイルが指定のベースパスにない場合', async () => {
      const filePath = 'missing.ts';
      const basePath = '/workspace/root/src';

      (VSCodeWrapper.Instance().findFiles as any).mockResolvedValueOnce([]);

      const result = await target.hasInBase(filePath, basePath);
      expect(result).toBe(false);
    });

    it('hasInBase_False_ワークスペース外のパスが指定された場合', async () => {
      const filePath = 'test.ts';
      const basePath = '/outside/workspace';

      // 例外をスローしてもfalseを返すことをテスト
      (VSCodeWrapper.Instance().findFiles as any).mockRejectedValueOnce(new Error('Test error'));

      const result = await target.hasInBase(filePath, basePath);
      expect(result).toBe(false);
    });
  });
});
