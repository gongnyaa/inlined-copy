import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogWrapper } from './utils/logWrapper';
import { IVSCodeWrapper, VSCodeWrapper } from './utils/VSCodeWrapper';

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

let logWrapperInstance: LogWrapper;
let mockVSCodeEnv: IVSCodeWrapper;

describe('LogWrapper 機能テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // VSCodeEnvironmentのモックを作成し、設定
    mockVSCodeEnv = {
      appendLine: vi.fn(),
      showInformationMessage: vi.fn().mockResolvedValue('OK'),
      showErrorMessage: vi.fn(),
      getConfiguration: vi.fn(),
      writeClipboard: vi.fn(),
      dispose: vi.fn(),
    };
    VSCodeWrapper.SetInstance(mockVSCodeEnv);

    // LogWrapperのインスタンスを作成し、設定
    LogWrapper.SetInstance(logWrapperInstance);

    // LogWrapperのインスタンスを作成し、設定
    logWrapperInstance = LogWrapper.Instance();
  });

  it('ログメッセージをプレフィックス付きで出力すること', () => {
    LogWrapper.Instance().log('テストメッセージ');

    expect(mockVSCodeEnv.appendLine).toHaveBeenCalledWith('[Inlined Copy] テストメッセージ', false);
  });

  it('エラーメッセージを出力し、出力チャンネルを表示すること', () => {
    LogWrapper.Instance().error('エラーメッセージ');

    expect(mockVSCodeEnv.appendLine).toHaveBeenCalledWith(
      '[Inlined Copy] ERROR エラーメッセージ',
      true
    );
  });

  it('ログ出力のテスト', () => {
    LogWrapper.Instance().log('テストメッセージ');

    expect(mockVSCodeEnv.appendLine).toHaveBeenCalledWith('[Inlined Copy] テストメッセージ', false);
  });
});
