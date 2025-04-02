import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogWrapper } from './logManager';
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

let _mockContext: any; // 未使用のためプレフィックスを追加
let logWrapperInstance: LogWrapper;
let mockVSCodeEnv: IVSCodeEnvironment;

describe('LogWrapper 機能テスト', () => {
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
      createOutputChannel: vi.fn(),
      registerDisposable: vi.fn(),
    };
    VSCodeEnvironment.SetInstance(mockVSCodeEnv);

    // createOutputChannelメソッドを追加
    mockVSCodeEnv.createOutputChannel = vi.fn().mockImplementation(() => mockCreateOutputChannel());
    mockVSCodeEnv.registerDisposable = vi.fn();

    // LogWrapperのインスタンスを作成し、設定
    logWrapperInstance = LogWrapper.CreateForTest(mockVSCodeEnv);
    LogWrapper.SetInstance(logWrapperInstance);

    // プライベートフィールドをリセット
    (logWrapperInstance as any)._outputChannel = undefined;

    _mockContext = {
      subscriptions: [],
    };
  });

  it('インスタンス作成時に出力チャンネルを作成し、正しく初期化すること', () => {
    // フィールドをリセットしてから新しいインスタンスを作成
    (logWrapperInstance as any)._outputChannel = undefined;
    const instance = LogWrapper.CreateForTest(mockVSCodeEnv);
    // 明示的に初期化を呼び出す
    instance.initialize();

    expect(mockVSCodeEnv.createOutputChannel).toHaveBeenCalledWith('Inlined Copy');
    expect(mockVSCodeEnv.createOutputChannel).toHaveBeenCalledTimes(1);
    expect(mockVSCodeEnv.registerDisposable).toHaveBeenCalled();
    expect(mockAppendLine).toHaveBeenCalledWith('[Inlined Copy] initialized');
  });

  it('複数回インスタンスを作成しても出力チャンネルが重複して作成されないこと', () => {
    vi.clearAllMocks();
    (logWrapperInstance as any)._outputChannel = mockCreateOutputChannel();

    // 新しいインスタンスを作成しても、既存の_outputChannelがあれば新規作成されないことを確認
    LogWrapper.CreateForTest(mockVSCodeEnv);
    LogWrapper.CreateForTest(mockVSCodeEnv);

    expect(mockVSCodeEnv.createOutputChannel).not.toHaveBeenCalled();
  });

  it('初期化後にログメッセージをプレフィックス付きで出力すること', () => {
    (logWrapperInstance as any)._outputChannel = mockCreateOutputChannel();

    LogWrapper.Instance().log('テストメッセージ');

    expect(mockAppendLine).toHaveBeenCalledWith('[Inlined Copy] テストメッセージ');
    expect(mockAppendLine).toHaveBeenCalledTimes(1);
  });

  it('エラーメッセージを出力し、出力チャンネルを表示すること', () => {
    (logWrapperInstance as any)._outputChannel = mockCreateOutputChannel();
    LogWrapper.Instance().error('エラーメッセージ');

    expect(mockAppendLine).toHaveBeenCalledWith('[Inlined Copy] ERROR エラーメッセージ');
    expect(mockShow).toHaveBeenCalled();
  });

  it('出力チャンネルを正しく破棄すること', () => {
    (logWrapperInstance as any)._outputChannel = mockCreateOutputChannel();

    LogWrapper.Instance().dispose();
    expect(mockAppendLine).toHaveBeenCalledWith(
      '[Inlined Copy] inlined Copy extension is now deactivated'
    );

    expect(mockDispose).toHaveBeenCalled();
  });

  it('トースト通知を表示し、ログにも記録すること', async () => {
    (logWrapperInstance as any)._outputChannel = mockCreateOutputChannel();
    const testMessage = 'テスト通知メッセージ';

    await LogWrapper.Instance().notify(testMessage);

    // トースト通知が表示されることを確認
    expect(mockVSCodeEnv.showInformationMessage).toHaveBeenCalledWith(
      `[Inlined Copy] ${testMessage}`
    );
  });
});
