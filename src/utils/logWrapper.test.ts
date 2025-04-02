import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogWrapper } from './logWrapper';
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
let _mockAppendLine: any;
let _mockShow: any;
let _mockDispose: any;
let mockShowInformationMessage: any;

let _mockContext: any; // 未使用のためプレフィックスを追加
let logWrapperInstance: LogWrapper;
let mockVSCodeEnv: IVSCodeEnvironment;

describe('LogWrapper 機能テスト', () => {
  beforeEach(() => {
    // テスト前にモックを取得
    mockCreateOutputChannel = vscode.window.createOutputChannel;
    _mockAppendLine = mockCreateOutputChannel().appendLine;
    _mockShow = mockCreateOutputChannel().show;
    _mockDispose = mockCreateOutputChannel().dispose;
    mockShowInformationMessage = vscode.window.showInformationMessage;

    // モックをリセット
    vi.clearAllMocks();

    // VSCodeEnvironmentのモックを作成し、設定
    mockVSCodeEnv = {
      appendLine: vi.fn(),
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
    LogWrapper.SetInstance(logWrapperInstance);

    // LogWrapperのインスタンスを設定
    logWrapperInstance = LogWrapper.Instance();

    _mockContext = {
      subscriptions: [],
    };
  });

  it('エラーメッセージを出力し、出力チャンネルを表示すること', () => {
    LogWrapper.Instance().error('エラーメッセージ');

    expect(mockVSCodeEnv.appendLine).toHaveBeenCalledWith(
      '[Inlined Copy] ERROR エラーメッセージ',
      true
    );
  });

  it('ログメッセージを出力すること', () => {
    LogWrapper.Instance().log('テストメッセージ');

    expect(mockVSCodeEnv.appendLine).toHaveBeenCalledWith('[Inlined Copy] テストメッセージ', false);
  });

  it('トースト通知を表示し、ログにも記録すること', async () => {
    const testMessage = 'テスト通知メッセージ';

    await LogWrapper.Instance().notify(testMessage);

    // トースト通知が表示されることを確認
    expect(mockVSCodeEnv.showInformationMessage).toHaveBeenCalledWith(
      `[Inlined Copy] ${testMessage}`
    );
  });
});
