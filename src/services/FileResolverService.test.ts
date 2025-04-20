import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { FileResolverService, FileResult } from './FileResolverService';
import { LogWrapper } from '../utils/LogWrapper';
import { mockLogWrapper } from '../utils/LogWrapper.mock';

vi.mock('vscode', () => {
  return {
    workspace: {
      workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
      findFiles: vi.fn(),
      asRelativePath: vi.fn(uri => uri.fsPath),
    },
  };
});

describe('FileResolverService', () => {
  let target: FileResolverService;

  beforeEach(() => {
    vi.clearAllMocks();
    LogWrapper.SetInstance(mockLogWrapper);
    target = new FileResolverService();
  });

  describe('resolveFilePath', () => {
    it('resolveFilePath_Happy', async () => {
      const mockFiles = [{ fsPath: '/test/workspace/src/test.ts' }];
      vi.mocked(vscode.workspace.findFiles).mockResolvedValueOnce(mockFiles as any);

      const result = await target.resolveFilePath('test.ts', '/test/workspace/src');

      expect(result).toEqual({ path: '/test/workspace/src/test.ts' });
      expect(vscode.workspace.findFiles).toHaveBeenCalledWith(
        'src/**/test.ts',
        '**/node_modules/**',
        10
      );
    });

    it('resolveFilePath_Happy_WithParentFolder', async () => {
      const mockFiles = [{ fsPath: '/test/workspace/src/utils/test.ts' }];
      vi.mocked(vscode.workspace.findFiles).mockResolvedValueOnce(mockFiles as any);

      const result = await target.resolveFilePath('utils/test.ts', '/test/workspace/src');

      expect(result).toEqual({ path: '/test/workspace/src/utils/test.ts' });
      expect(vscode.workspace.findFiles).toHaveBeenCalledWith(
        'src/utils/test.ts',
        '**/node_modules/**',
        10
      );
    });

    it('resolveFilePath_Happy_WithoutExtension', async () => {
      const mockFiles = [{ fsPath: '/test/workspace/src/test.ts' }];
      vi.mocked(vscode.workspace.findFiles).mockResolvedValueOnce(mockFiles as any);

      const result = await target.resolveFilePath('test', '/test/workspace/src');

      expect(result).toEqual({ path: '/test/workspace/src/test.ts' });
      expect(vscode.workspace.findFiles).toHaveBeenCalledWith(
        'src/**/test.*',
        '**/node_modules/**',
        10
      );
    });

    it('resolveFilePath_Error_NoWorkspace', async () => {
      const originalWorkspaceFolders = vscode.workspace.workspaceFolders;
      Object.defineProperty(vscode.workspace, 'workspaceFolders', {
        get: vi.fn().mockReturnValue(undefined),
        configurable: true,
      });

      const result = await target.resolveFilePath('test.ts', '/test/workspace/src');

      expect(result).toEqual({ error: 'ワークスペースが見つかりません' });

      Object.defineProperty(vscode.workspace, 'workspaceFolders', {
        get: () => originalWorkspaceFolders,
        configurable: true,
      });
    });

    it('resolveFilePath_Error_FileNotFound', async () => {
      vi.mocked(vscode.workspace.findFiles).mockResolvedValue([] as any);

      const result = await target.resolveFilePath('test.ts', '/test/workspace/src');

      expect(result).toEqual({ error: 'ファイルが見つかりません: test.ts' });
    });

    it('resolveFilePath_Error_Exception', async () => {
      const testError = new Error('テストエラー');
      vi.mocked(vscode.workspace.findFiles).mockRejectedValueOnce(testError);

      const result = await target.resolveFilePath('test.ts', '/test/workspace/src');

      expect(result).toEqual({ error: 'エラー: テストエラー' });
      expect(mockLogWrapper.error).toHaveBeenCalledWith('ファイル解決エラー: Error: テストエラー');
    });
  });
});
