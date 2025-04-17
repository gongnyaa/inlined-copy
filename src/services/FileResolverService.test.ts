import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileResolverService, fileSuccess, fileFailure } from './FileResolverService';
import { LogWrapper } from '../utils/LogWrapper';
import { mockLogWrapper } from '../utils/LogWrapper.mock';

vi.mock('vscode', () => {
  const mockFindFiles = vi.fn();
  const mockWorkspaceFolder = {
    uri: {
      fsPath: '/test/workspace',
    },
    name: 'workspace',
    index: 0,
  };

  return {
    workspace: {
      workspaceFolders: [mockWorkspaceFolder],
      findFiles: mockFindFiles,
      asRelativePath: vi.fn((uri) => uri.fsPath),
    },
  };
});

import * as vscode from 'vscode';

describe('FileResolverService', () => {
  let target: FileResolverService;
  const mockWorkspaceFolder = {
    uri: {
      fsPath: '/test/workspace',
    },
    name: 'workspace',
    index: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    LogWrapper.SetInstance(mockLogWrapper);
    vi.mocked(vscode.workspace).workspaceFolders = [mockWorkspaceFolder as any];
    target = new FileResolverService();
  });

  describe('resolveFilePath', () => {
    it('resolveFilePath_Happy', async () => {
      vi.mocked(vscode.workspace.findFiles).mockResolvedValueOnce([
        { fsPath: '/test/workspace/src/test.ts' } as any,
      ]);

      const result = await target.resolveFilePath('test.ts', '/test/workspace/src');

      expect(result).toEqual(fileSuccess('/test/workspace/src/test.ts'));
      expect(vscode.workspace.findFiles).toHaveBeenCalledWith(
        'src/**/test.ts',
        '**/node_modules/**',
        10
      );
    });

    it('resolveFilePath_Error_NoWorkspace', async () => {
      vi.mocked(vscode.workspace).workspaceFolders = [];

      const result = await target.resolveFilePath('test.ts', '/test/workspace/src');

      expect(result).toEqual(fileFailure('ワークスペースが見つかりません'));
    });

    it('resolveFilePath_Error_FileNotFound', async () => {
      vi.mocked(vscode.workspace.findFiles).mockResolvedValue([]);

      const result = await target.resolveFilePath('test.ts', '/test/workspace/src');

      expect(result).toEqual(expect.objectContaining({
        success: false
      }));
      expect(result.success).toBe(false);
    });

    it('resolveFilePath_Error_Exception', async () => {
      const testError = new Error('テストエラー');
      vi.mocked(vscode.workspace.findFiles).mockRejectedValueOnce(testError);

      const result = await target.resolveFilePath('test.ts', '/test/workspace/src');

      expect(result).toEqual(fileFailure('エラー: テストエラー'));
      expect(mockLogWrapper.error).toHaveBeenCalled();
    });
  });

  describe('getSuggestions', () => {
    it('getSuggestions_Happy', async () => {
      vi.mocked(vscode.workspace.findFiles).mockResolvedValueOnce([
        { fsPath: '/test/workspace/src/test.ts' } as any,
      ]);

      const result = await target.getSuggestions('test');

      expect(result).toEqual(['/test/workspace/src/test.ts']);
      expect(vscode.workspace.findFiles).toHaveBeenCalledWith(
        '**/test.*',
        '**/node_modules/**',
        5
      );
    });

    it('getSuggestions_Error_Exception', async () => {
      const testError = new Error('テストエラー');
      vi.mocked(vscode.workspace.findFiles).mockRejectedValueOnce(testError);

      const result = await target.getSuggestions('test');

      expect(result).toEqual([]);
      expect(mockLogWrapper.error).toHaveBeenCalled();
    });
  });
});
