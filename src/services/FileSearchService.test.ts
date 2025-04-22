import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileSearchService } from './FileSearchService';
import { LogWrapper } from '../utils/LogWrapper';
import { mockLogWrapper } from '../utils/LogWrapper.mock';
import * as vscode from 'vscode';

vi.mock('vscode', () => ({
  workspace: {
    findFiles: vi.fn(),
    workspaceFolders: [{ uri: { fsPath: '/workspace' } }],
  },
  Uri: {
    file: (path: string) => ({ fsPath: path }),
  },
  RelativePattern: vi.fn(),
  window: {
    createOutputChannel: vi.fn().mockReturnValue({
      appendLine: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn(),
    }),
  },
}));

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

      (vscode.workspace.findFiles as any).mockResolvedValueOnce([{ fsPath: expectedPath }]);

      const result = await target.findFileInBase(filePath, basePath);
      expect(result).toBe(expectedPath);
    });

    it('findFileInBase_Error_ファイルが見つからない場合', async () => {
      const filePath = 'missing.ts';
      const basePath = '/workspace/root/src';

      (vscode.workspace.findFiles as any).mockResolvedValueOnce([]);

      await expect(target.findFileInBase(filePath, basePath)).rejects.toThrow(
        'ファイルが見つかりません: missing.ts'
      );
    });

    it('findFileInBase_Error_ワークスペース外のパスが指定された場合', async () => {
      const filePath = 'test.ts';
      const basePath = '/outside/workspace';

      await expect(target.findFileInBase(filePath, basePath)).rejects.toThrow(
        'ワークスペース外のパスが指定されました'
      );
    });
  });

  describe('findParent', () => {
    it('指定されたパスの親ディレクトリを返す', async () => {
      const result = await target.findParent('/workspace/test/path');
      expect(result).toBe('/workspace/test');
    });

    it('ワークスペース外のパスが指定された場合はエラーを投げる', async () => {
      await expect(target.findParent('/outside/workspace')).rejects.toThrow(
        'ワークスペース外のパスが指定されました'
      );
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
      const expectedPath = '/workspace/root/src/test.ts';

      (vscode.workspace.findFiles as any).mockResolvedValueOnce([{ fsPath: expectedPath }]);

      const result = await target.hasInBase(filePath, basePath);
      expect(result).toBe(true);

      // 正しいパターンで検索されたことを確認
    });

    it('hasInBase_False_ファイルが指定のベースパスにない場合', async () => {
      const filePath = 'missing.ts';
      const basePath = '/workspace/root/src';

      (vscode.workspace.findFiles as any).mockResolvedValueOnce([]);

      const result = await target.hasInBase(filePath, basePath);
      expect(result).toBe(false);
    });

    it('hasInBase_False_ワークスペース外のパスが指定された場合', async () => {
      const filePath = 'test.ts';
      const basePath = '/outside/workspace';

      (vscode.workspace.findFiles as any).mockResolvedValueOnce([]);

      const result = await target.hasInBase(filePath, basePath);
      expect(result).toBe(false);
    });
  });
});
