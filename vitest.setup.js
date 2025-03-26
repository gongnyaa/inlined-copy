"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// Mock the vscode module
vitest_1.vi.mock('vscode', () => {
    return {
        workspace: {
            workspaceFolders: [{ uri: { fsPath: '/workspace/root' } }],
            findFiles: vitest_1.vi.fn().mockResolvedValue([]),
            asRelativePath: vitest_1.vi.fn().mockImplementation((uri) => {
                return typeof uri === 'string' ? uri : uri.fsPath.replace('/workspace/root/', '');
            })
        },
        window: {
            showInformationMessage: vitest_1.vi.fn(),
            showWarningMessage: vitest_1.vi.fn(),
            showErrorMessage: vitest_1.vi.fn(),
            createOutputChannel: vitest_1.vi.fn().mockReturnValue({
                appendLine: vitest_1.vi.fn(),
                show: vitest_1.vi.fn(),
                clear: vitest_1.vi.fn()
            })
        },
        env: {
            clipboard: {
                writeText: vitest_1.vi.fn()
            }
        },
        Uri: {
            file: vitest_1.vi.fn().mockImplementation((path) => ({ fsPath: path })),
            parse: vitest_1.vi.fn().mockImplementation((uri) => ({ fsPath: uri }))
        },
        commands: {
            registerCommand: vitest_1.vi.fn()
        },
        extensions: {
            getExtension: vitest_1.vi.fn()
        },
        ConfigurationTarget: {
            Global: 1,
            Workspace: 2,
            WorkspaceFolder: 3
        }
    };
});
// Mock fs module to avoid "Cannot redefine property" errors
vitest_1.vi.mock('fs', () => {
    return {
        existsSync: vitest_1.vi.fn().mockReturnValue(true),
        readFile: vitest_1.vi.fn().mockImplementation((path, options, callback) => {
            if (typeof options === 'function') {
                callback = options;
            }
            callback(null, 'Mock file content');
        }),
        statSync: vitest_1.vi.fn().mockReturnValue({ size: 1024 }),
        mkdirSync: vitest_1.vi.fn(),
        writeFileSync: vitest_1.vi.fn(),
        readdirSync: vitest_1.vi.fn().mockReturnValue([]),
        unlinkSync: vitest_1.vi.fn(),
        rmdirSync: vitest_1.vi.fn(),
        rmSync: vitest_1.vi.fn()
    };
});
// Mock LogManager to avoid "Cannot read properties of undefined (reading 'toLowerCase')" error
vitest_1.vi.mock('../src/utils/logManager', () => {
    return {
        LogManager: {
            getLogLevel: vitest_1.vi.fn().mockReturnValue(0),
            debug: vitest_1.vi.fn(),
            info: vitest_1.vi.fn(),
            warn: vitest_1.vi.fn(),
            error: vitest_1.vi.fn(),
            setLogLevel: vitest_1.vi.fn()
        }
    };
});
//# sourceMappingURL=vitest.setup.js.map