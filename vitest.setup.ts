import { vi } from 'vitest';

// Mock the vscode module
vi.mock('vscode', () => {
  return {
    workspace: {
      workspaceFolders: [{ uri: { fsPath: '/workspace/root' } }],
      findFiles: vi.fn().mockResolvedValue([]),
      asRelativePath: vi.fn().mockImplementation(uri => {
        return typeof uri === 'string' ? uri : uri.fsPath.replace('/workspace/root/', '');
      }),
    },
    window: {
      showInformationMessage: vi.fn(),
      showWarningMessage: vi.fn(),
      showErrorMessage: vi.fn(),
      createOutputChannel: vi.fn().mockReturnValue({
        appendLine: vi.fn(),
        show: vi.fn(),
        clear: vi.fn(),
        dispose: vi.fn(),
      }),
    },
    env: {
      clipboard: {
        writeText: vi.fn(),
      },
    },
    Uri: {
      file: vi.fn().mockImplementation(path => ({ fsPath: path })),
      parse: vi.fn().mockImplementation(uri => ({ fsPath: uri })),
    },
    commands: {
      registerCommand: vi.fn(),
    },
    extensions: {
      getExtension: vi.fn(),
    },
    ConfigurationTarget: {
      Global: 1,
      Workspace: 2,
      WorkspaceFolder: 3,
    },
  };
});

// Mock fs module to avoid "Cannot redefine property" errors
vi.mock('fs', () => {
  return {
    existsSync: vi.fn().mockReturnValue(true),
    readFile: vi.fn().mockImplementation((path, options, callback) => {
      if (typeof options === 'function') {
        callback = options;
      }
      callback(null, 'Mock file content');
    }),
    statSync: vi.fn().mockReturnValue({ size: 1024 }),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readdirSync: vi.fn().mockReturnValue([]),
    unlinkSync: vi.fn(),
    rmdirSync: vi.fn(),
    rmSync: vi.fn(),
  };
});
