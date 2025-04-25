import { PathWrapper, PathInfo } from './PathWrapper';
import { vi } from 'vitest';

// PathInfoのモック実装
export class MockPathInfo implements PathInfo {
  hasExtension = true;
  hasParentFolder = false;
  parentFolder = '';
  baseSearchPattern = '';

  constructor(filePath: string) {
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

// PathWrapperのモック実装
export const mockPathWrapper: Partial<PathWrapper> = {
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
  isPathInside: vi.fn().mockImplementation((checkPath, _basePath) => {
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
    .mockImplementation(async (workspaceRoot, basePath, filePath, _excludePattern, _maxResults) => {
      // ワークスペース外のパスの場合はエラーを投げる
      if (!basePath.startsWith('/workspace')) {
        throw new Error('path_outside_workspace');
      }

      // テストケースに応じて結果を返す
      if (filePath === 'missing.ts') {
        return null;
      }

      return `${basePath}/${filePath}`;
    }),
};
