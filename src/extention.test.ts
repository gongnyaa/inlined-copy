import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogWrapper } from './utils/logManager';
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

let logWrapperInstance: LogWrapper;
let mockVSCodeEnv: IVSCodeEnvironment;

describe('LogWrapper 機能テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // VSCodeEnvironmentのモックを作成し、設定
    mockVSCodeEnv = {
      showInformationMessage: vi.fn().mockResolvedValue('OK'),
      showErrorMessage: vi.fn(),
      getConfiguration: vi.fn(),
      writeClipboard: vi.fn(),
      createOutputChannel: vi.fn().mockReturnValue(mockOutputChannel),
      registerDisposable: vi.fn(),
    };
    VSCodeEnvironment.SetInstance(mockVSCodeEnv);

    // LogWrapperのインスタンスを作成し、設定
    logWrapperInstance = LogWrapper.CreateForTest(mockVSCodeEnv);
    LogWrapper.SetInstance(logWrapperInstance);

    // プライベートフィールドをリセット
    (logWrapperInstance as any)._outputChannel = undefined;

    // createOutputChannelが戻り値として返すモックを設定
    (vscode.window.createOutputChannel as any).mockReturnValue(mockOutputChannel);
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
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith('[Inlined Copy] initialized');
  });

  it('複数回インスタンスを作成しても出力チャンネルが重複して作成されないこと', () => {
    vi.clearAllMocks();
    (logWrapperInstance as any)._outputChannel = mockOutputChannel;

    // 新しいインスタンスを作成しても、既存の_outputChannelがあれば新規作成されないことを確認
    LogWrapper.CreateForTest(mockVSCodeEnv);
    LogWrapper.CreateForTest(mockVSCodeEnv);

    expect(mockVSCodeEnv.createOutputChannel).not.toHaveBeenCalled();
  });

  it('初期化後にログメッセージをプレフィックス付きで出力すること', () => {
    (logWrapperInstance as any)._outputChannel = mockOutputChannel;

    LogWrapper.Instance().log('テストメッセージ');

    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith('[Inlined Copy] テストメッセージ');
    expect(mockOutputChannel.appendLine).toHaveBeenCalledTimes(1);
  });

  it('エラーメッセージを出力し、出力チャンネルを表示すること', () => {
    (logWrapperInstance as any)._outputChannel = mockOutputChannel;

    LogWrapper.Instance().error('エラーメッセージ');

    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      '[Inlined Copy] ERROR エラーメッセージ'
    );
    expect(mockOutputChannel.show).toHaveBeenCalled();
  });

  it('出力チャンネルを正しく破棄すること', () => {
    (logWrapperInstance as any)._outputChannel = mockOutputChannel;

    LogWrapper.Instance().dispose();

    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
      '[Inlined Copy] inlined Copy extension is now deactivated'
    );
    expect(mockOutputChannel.dispose).toHaveBeenCalled();
  });
});
