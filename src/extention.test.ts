import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ILogManager, LogManager } from './utils/logManager';
import { IVSCodeEnvironment, VSCodeEnvironment } from './utils/vscodeEnvironment';
import * as vscode from 'vscode';

vi.mock('vscode', () => {
  return {
    window: {
      createOutputChannel: vi.fn().mockReturnValue({
        appendLine: vi.fn(),
        show: vi.fn(),
        dispose: vi.fn(),
      }),
      showInformationMessage: vi.fn().mockResolvedValue('OK'),
    },
  };
});

// テスト用のモックOutputChannelへの参照
const mockOutputChannel = {
  appendLine: vi.fn(),
  show: vi.fn(),
  dispose: vi.fn(),
};

let logManagerInstance: ILogManager;
let mockVSCodeEnv: IVSCodeEnvironment;

describe('LogManager 機能テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // VSCodeEnvironmentのモックを作成し、設定
    mockVSCodeEnv = {
      showInformationMessage: vi.fn().mockResolvedValue('OK'),
      showErrorMessage: vi.fn(),
      getConfiguration: vi.fn(),
      writeClipboard: vi.fn(),
    };
    VSCodeEnvironment.SetInstance(mockVSCodeEnv);

    // LogManagerのインスタンスを作成し、設定
    logManagerInstance = new LogManager(mockVSCodeEnv);
    LogManager.SetInstance(logManagerInstance);

    // プライベートフィールドをリセット
    (logManagerInstance as any)._outputChannel = undefined;

    // createOutputChannelが戻り値として返すモックを設定
    (vscode.window.createOutputChannel as any).mockReturnValue(mockOutputChannel);
  });

  it('初期化時に出力チャンネルを作成し、正しく初期化すること', () => {
    const mockContext = {
      subscriptions: [],
    } as unknown as vscode.ExtensionContext;

    LogManager.Instance().initialize(mockContext);

    expect(vscode.window.createOutputChannel).toHaveBeenCalledWith('Inlined Copy');
    expect(vscode.window.createOutputChannel).toHaveBeenCalledTimes(1);
    expect(mockContext.subscriptions.length).toBe(1);
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith('[Inlined Copy] initialized');
  });

  it('複数回初期化しても出力チャンネルが重複して作成されないこと', () => {
    const mockContext = {
      subscriptions: [],
    } as unknown as vscode.ExtensionContext;

    LogManager.Instance().initialize(mockContext);
    LogManager.Instance().initialize(mockContext);

    expect(vscode.window.createOutputChannel).toHaveBeenCalledTimes(1);
    expect(mockContext.subscriptions.length).toBe(1);
  });

  it('初期化後にログメッセージをプレフィックス付きで出力すること', () => {
    (logManagerInstance as any)._outputChannel = mockOutputChannel;

    LogManager.Instance().log('テストメッセージ');

    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith('[Inlined Copy] テストメッセージ');
    expect(mockOutputChannel.appendLine).toHaveBeenCalledTimes(1);
  });

  it('エラーメッセージを出力し、出力チャンネルを表示すること', () => {
    (logManagerInstance as any)._outputChannel = mockOutputChannel;

    LogManager.Instance().error('エラーメッセージ');

    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      '[Inlined Copy] ERROR エラーメッセージ'
    );
    expect(mockOutputChannel.show).toHaveBeenCalled();
  });

  it('出力チャンネルを正しく破棄すること', () => {
    (logManagerInstance as any)._outputChannel = mockOutputChannel;

    LogManager.Instance().dispose();

    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      '[Inlined Copy] inlined Copy extension is now deactivated'
    );
    expect(mockOutputChannel.dispose).toHaveBeenCalled();
  });
});
