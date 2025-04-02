import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ILogManager, LogManager } from './logManager';
import { IVSCodeEnvironment, VSCodeEnvironment } from './vscodeEnvironment';
import * as vscode from 'vscode';

// 最初にvi.mockを呼び出す（変数参照なし）
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

// 後でテスト中にモックを取得
let mockCreateOutputChannel: any;
let mockAppendLine: any;
let mockShow: any;
let mockDispose: any;
let mockShowInformationMessage: any;

let mockContext: any;
let logManagerInstance: ILogManager;
let mockVSCodeEnv: IVSCodeEnvironment;

describe('LogManager 機能テスト', () => {
  beforeEach(() => {
    // テスト前にモックを取得
    mockCreateOutputChannel = vscode.window.createOutputChannel;
    mockAppendLine = mockCreateOutputChannel().appendLine;
    mockShow = mockCreateOutputChannel().show;
    mockDispose = mockCreateOutputChannel().dispose;
    mockShowInformationMessage = vscode.window.showInformationMessage;

    // モックをリセット
    vi.clearAllMocks();

    // VSCodeEnvironmentのモックを作成し、設定
    mockVSCodeEnv = {
      showInformationMessage: vi.fn().mockImplementation(msg => mockShowInformationMessage(msg)),
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

    mockContext = {
      subscriptions: [],
    };
  });

  it('初期化時に出力チャンネルを作成し、正しく初期化すること', () => {
    LogManager.Instance().initialize(mockContext as any);

    expect(mockCreateOutputChannel).toHaveBeenCalledWith('Inlined Copy');
    expect(mockCreateOutputChannel).toHaveBeenCalledTimes(1);
    expect(mockContext.subscriptions.length).toBe(1);
    expect(mockAppendLine).toHaveBeenCalledWith('[Inlined Copy] initialized');
  });

  it('複数回初期化しても出力チャンネルが重複して作成されないこと', () => {
    vi.clearAllMocks();
    LogManager.Instance().initialize(mockContext as any);
    LogManager.Instance().initialize(mockContext as any);

    expect(mockCreateOutputChannel).toHaveBeenCalledTimes(1);
    expect(mockContext.subscriptions.length).toBe(1);
  });

  it('初期化後にログメッセージをプレフィックス付きで出力すること', () => {
    (logManagerInstance as any)._outputChannel = mockCreateOutputChannel();

    LogManager.Instance().log('テストメッセージ');

    expect(mockAppendLine).toHaveBeenCalledWith('[Inlined Copy] テストメッセージ');
    expect(mockAppendLine).toHaveBeenCalledTimes(1);
  });

  it('エラーメッセージを出力し、出力チャンネルを表示すること', () => {
    (logManagerInstance as any)._outputChannel = mockCreateOutputChannel();
    LogManager.Instance().error('エラーメッセージ');

    expect(mockAppendLine).toHaveBeenCalledWith('[Inlined Copy] ERROR エラーメッセージ');
    expect(mockShow).toHaveBeenCalled();
  });

  it('出力チャンネルを正しく破棄すること', () => {
    (logManagerInstance as any)._outputChannel = mockCreateOutputChannel();

    LogManager.Instance().dispose();
    expect(mockAppendLine).toHaveBeenCalledWith(
      '[Inlined Copy] inlined Copy extension is now deactivated'
    );

    expect(mockDispose).toHaveBeenCalled();
  });

  it('トースト通知を表示し、ログにも記録すること', async () => {
    (logManagerInstance as any)._outputChannel = mockCreateOutputChannel();
    const testMessage = 'テスト通知メッセージ';

    await LogManager.Instance().notify(testMessage);

    // トースト通知が表示されることを確認
    expect(mockVSCodeEnv.showInformationMessage).toHaveBeenCalledWith(
      `[Inlined Copy] ${testMessage}`
    );
  });
});
