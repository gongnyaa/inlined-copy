import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileResolver } from './fileResolver';
import { fileSuccess, fileFailure } from './fileResult';
// LogManagerをモック化
vi.mock('../utils/logManager', () => {
  return {
    LogManager: {
      debug: vi.fn(),
      error: vi.fn(),
      getLogLevel: vi.fn().mockReturnValue('debug'),
    },
  };
});

// VSCodeEnvironmentをモック化
vi.mock('../utils/vscodeEnvironment', () => {
  return {
    VSCodeEnvironment: {
      getConfiguration: vi.fn().mockReturnValue('debug'),
    },
  };
});

// テスト用のヘルパー関数
function createMockUri(filePath: string): vscode.Uri {
  return { fsPath: filePath } as vscode.Uri;
}

// VSCodeのAPIをモック化
vi.mock('vscode', () => {
  return {
    workspace: {
      findFiles: vi.fn(),
      asRelativePath: vi.fn((uri: { fsPath: string }) => uri.fsPath),
      getConfiguration: vi.fn().mockReturnValue({
        get: vi.fn().mockReturnValue('debug'),
      }),
    },
    Uri: {
      file: (path: string) => ({ fsPath: path }) as vscode.Uri,
    },
  };
});

// vscodeをインポート
import * as vscode from 'vscode';

describe('FileResolver', () => {
  const mockBasePath = '/mock/base/path';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('resolveFilePath', () => {
    it('拡張子なしのファイル名で正しく解決できる', async () => {
      // モックの設定
      const mockFiles = [createMockUri('/mock/path/file.md'), createMockUri('/mock/path/file.txt')];

      // テスト用のモックファイルを準備
      const mockFindFiles = vi.mocked(vscode.workspace.findFiles);

      // 最初の呼び出し（拡張子付き検索）は結果なし
      mockFindFiles.mockResolvedValueOnce([]);

      // 2回目の呼び出し（拡張子なし検索）は結果あり
      mockFindFiles.mockResolvedValueOnce(mockFiles);

      // テスト実行
      const result = await FileResolver.resolveFilePath('file', mockBasePath);

      // 検証
      expect(result).toEqual(fileSuccess('/mock/path/file.md'));
      expect(vscode.workspace.findFiles).toHaveBeenCalledTimes(2);
    });

    it('拡張子付きのファイル名で正しく解決できる', async () => {
      // モックの設定
      const mockFiles = [createMockUri('/mock/path/file.md'), createMockUri('/mock/path/file.txt')];

      // テスト用のモックファイルを準備
      const mockFindFiles = vi.mocked(vscode.workspace.findFiles);

      // 拡張子付き検索は結果あり
      mockFindFiles.mockResolvedValueOnce(mockFiles);

      // テスト実行
      const result = await FileResolver.resolveFilePath('file.md', mockBasePath);

      // 検証
      expect(result).toEqual(fileSuccess('/mock/path/file.md'));
      expect(vscode.workspace.findFiles).toHaveBeenCalledTimes(1);
      expect(vscode.workspace.findFiles).toHaveBeenCalledWith(
        '**/file.md',
        '**/node_modules/**',
        10
      );
    });

    it('ディレクトリ付きのファイル名で正しく解決できる', async () => {
      // モックの設定
      const mockFiles = [createMockUri('/mock/path/dir/file.md')];

      // テスト用のモックファイルを準備
      const mockFindFiles = vi.mocked(vscode.workspace.findFiles);

      // 拡張子付き検索は結果あり
      mockFindFiles.mockResolvedValueOnce(mockFiles);

      // テスト実行
      const result = await FileResolver.resolveFilePath('dir/file.md', mockBasePath);

      // 検証
      expect(result).toEqual(fileSuccess('/mock/path/dir/file.md'));
      expect(vscode.workspace.findFiles).toHaveBeenCalledWith(
        '**/dir/**/file.md',
        '**/node_modules/**',
        10
      );
    });

    it('ファイルが見つからない場合はエラーを返す', async () => {
      // モックの設定
      // テスト用のモックファイルを準備
      const mockFindFiles = vi.mocked(vscode.workspace.findFiles);

      // 両方の検索で結果なし
      mockFindFiles.mockResolvedValueOnce([]);
      mockFindFiles.mockResolvedValueOnce([]);

      // テスト実行
      const result = await FileResolver.resolveFilePath('nonexistent', mockBasePath);

      // 検証
      expect(result).toEqual(fileFailure('File not found: nonexistent'));
    });

    it('複数のファイルが見つかった場合は最適なものを選択する', async () => {
      // モックの設定
      const mockFiles = [
        createMockUri('/mock/path/file.json'),
        createMockUri('/mock/path/file.md'),
        createMockUri('/mock/path/file.txt'),
      ];

      // テスト用のモックファイルを準備
      const mockFindFiles = vi.mocked(vscode.workspace.findFiles);

      // 最初の呼び出し（拡張子付き検索）は結果なし
      mockFindFiles.mockResolvedValueOnce([]);

      // 2回目の呼び出し（拡張子なし検索）は結果あり
      mockFindFiles.mockResolvedValueOnce(mockFiles);

      // テスト実行
      const result = await FileResolver.resolveFilePath('file', mockBasePath);

      // 検証 - デフォルト拡張子リストの順序に従って.mdが選ばれるはず
      expect(result).toEqual(fileSuccess('/mock/path/file.md'));
    });
  });

  describe('getSuggestions', () => {
    it('ファイル候補を正しく取得できる', async () => {
      // モックの設定
      const mockFiles = [createMockUri('/mock/path/file.md'), createMockUri('/mock/path/file.txt')];

      // テスト用のモックファイルを準備
      const mockFindFiles = vi.mocked(vscode.workspace.findFiles);

      // 拡張子付き検索は結果あり
      mockFindFiles.mockResolvedValueOnce(mockFiles);

      // テスト実行
      const suggestions = await FileResolver.getSuggestions('file');

      // 検証
      expect(suggestions).toEqual(['/mock/path/file.md', '/mock/path/file.txt']);
    });
  });
});
