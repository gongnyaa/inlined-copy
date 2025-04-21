import * as vscode from 'vscode';
import * as path from 'path';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileSearchService } from './FileSearchService';
import type { Mock } from 'vitest';

// VSCodeのAPIをモック
vi.mock('vscode', () => {
  return {
    workspace: {
      workspaceFolders: [{ uri: { fsPath: '/workspace/root' } }],
      findFiles: vi.fn(),
      asRelativePath: vi.fn((uri: any) => {
        if (typeof uri === 'string') return uri;
        return uri.fsPath.replace('/workspace/root/', '');
      }),
    },
    Uri: {
      file: (path: string) => ({ fsPath: path }),
    },
  };
});

describe('FileSearchService', () => {
  let target: FileSearchService;
  const mockWorkspaceRoot = '/workspace/root';

  beforeEach(() => {
    vi.clearAllMocks();
    target = FileSearchService.Instance();
  });

  describe('findFileInBase', () => {
    it('findFileInBase_HappyPath_指定パスでファイルが見つかる場合', async () => {
      // Arrange
      const filePath = 'test.ts';
      const basePath = `${mockWorkspaceRoot}/src`;
      const expectedPath = `${mockWorkspaceRoot}/src/test.ts`;
      (vscode.workspace.findFiles as Mock).mockResolvedValueOnce([{ fsPath: expectedPath }]);

      // Act
      const result = await target.findFileInBase(filePath, basePath);

      // Assert
      expect(vscode.workspace.findFiles).toHaveBeenCalledWith(
        'src/**/test.ts',
        '**/node_modules/**',
        10
      );
      expect(result).toEqual({ path: expectedPath });
    });

    it('findFileInBase_Error_ファイルが見つからない場合', async () => {
      // Arrange
      const filePath = 'notfound.ts';
      const basePath = `${mockWorkspaceRoot}/src`;
      (vscode.workspace.findFiles as Mock).mockResolvedValueOnce([]);

      // Act
      const result = await target.findFileInBase(filePath, basePath);

      // Assert
      expect(result).toEqual({ error: 'ファイルが見つかりません: notfound.ts' });
    });

    it('findFileInBase_Error_ワークスペース外のパス指定時', async () => {
      // Arrange
      const filePath = 'test.ts';
      const basePath = '/outside/workspace';

      // Act
      const result = await target.findFileInBase(filePath, basePath);

      // Assert
      expect(result).toEqual({ error: 'ワークスペース外のパスが指定されました' });
    });
  });

  describe('findParent', () => {
    it('findParent_HappyPath_親ディレクトリ取得成功', async () => {
      // Arrange
      const basePath = `${mockWorkspaceRoot}/src/components`;
      const expectedParent = `${mockWorkspaceRoot}/src`;

      // Act
      const result = await target.findParent(basePath);

      // Assert
      expect(result).toEqual({ path: expectedParent });
    });

    it('findParent_Error_ワークスペースルート以上の親を取得しようとした場合', async () => {
      // Arrange
      const basePath = mockWorkspaceRoot;

      // Act
      const result = await target.findParent(basePath);

      // Assert
      expect(result).toEqual({ error: 'ワークスペース外のパスが検出されました' });
    });
  });
});
