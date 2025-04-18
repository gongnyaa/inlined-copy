import { vi } from 'vitest';

/**
 * 最小限のグローバルモック定義
 *
 * このファイルは複数のテストファイルで共通して使用される
 * 基本的なvscodeとfsモジュールのモックを提供します。
 * 各テストファイルは必要に応じて独自のモックを追加できます。
 */

vi.mock('vscode', () => {
  return {
    workspace: {
      workspaceFolders: [{ uri: { fsPath: '/workspace/root' } }],
      findFiles: vi.fn().mockResolvedValue([]),
      getConfiguration: vi.fn().mockReturnValue({
        get: vi.fn(),
      }),
    },
    window: {
      showInformationMessage: vi.fn(),
      showWarningMessage: vi.fn(),
      showErrorMessage: vi.fn(),
      createOutputChannel: vi.fn().mockReturnValue({
        appendLine: vi.fn(),
        show: vi.fn(),
        dispose: vi.fn(),
      }),
    },
    env: {
      clipboard: {
        writeText: vi.fn(),
      },
    },
    commands: {
      registerCommand: vi.fn(),
    },
  };
});

vi.mock('fs', () => {
  return {
    existsSync: vi.fn().mockReturnValue(true),
    readFile: vi.fn(),
    statSync: vi.fn().mockReturnValue({ size: 1024 }),
  };
});
