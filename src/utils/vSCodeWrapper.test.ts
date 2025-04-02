// src/utils/vSCodeWrapper.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VSCodeWrapper } from './vSCodeWrapper';

vi.mock('vscode', async () => {
  const mockOutputChannel = {
    appendLine: vi.fn(),
    show: vi.fn(),
    dispose: vi.fn(),
  };

  const mockVSCode = {
    window: {
      createOutputChannel: vi.fn().mockReturnValue(mockOutputChannel),
      showInformationMessage: vi.fn().mockResolvedValue(undefined),
      showErrorMessage: vi.fn().mockResolvedValue(undefined),
    },
    workspace: {
      getConfiguration: vi.fn().mockReturnValue({
        get: vi.fn(),
      }),
    },
    env: {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    },
  };

  return mockVSCode;
});

describe('VSCodeWrapper', () => {
  let wrapper: VSCodeWrapper;
  let vscode: any;
  let mockOutputChannel: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vscode = await import('vscode');
    mockOutputChannel = {
      appendLine: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn(),
    };
    vi.mocked(vscode.window.createOutputChannel).mockReturnValue(mockOutputChannel);
    wrapper = new VSCodeWrapper();
    VSCodeWrapper.SetInstance(wrapper);
  });

  it('シングルトンインスタンスが正しく取得できること', () => {
    const instance = VSCodeWrapper.Instance();
    expect(instance).toBe(wrapper);
  });

  it('SetInstanceで設定したインスタンスが取得できること', () => {
    const mockInstance = {} as VSCodeWrapper;
    VSCodeWrapper.SetInstance(mockInstance);
    const instance = VSCodeWrapper.Instance();
    expect(instance).toBe(mockInstance);
  });

  it('appendLineがメッセージを出力すること', () => {
    wrapper.appendLine('テストメッセージ', false);
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith('テストメッセージ');
    expect(mockOutputChannel.show).not.toHaveBeenCalled();
  });

  it('appendLineでneedShowがtrueの場合、出力チャンネルが表示されること', () => {
    wrapper.appendLine('テストメッセージ', true);
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith('テストメッセージ');
    expect(mockOutputChannel.show).toHaveBeenCalled();
  });

  it('showInformationMessageが正しく呼ばれること', async () => {
    await wrapper.showInformationMessage('情報メッセージ');
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('情報メッセージ');
  });

  it('showErrorMessageが正しく呼ばれること', async () => {
    await wrapper.showErrorMessage('エラーメッセージ');
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('エラーメッセージ');
  });

  it('getConfigurationが設定値を正しく取得すること', () => {
    const getMock = vi.fn().mockReturnValue('設定値');
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({ get: getMock });

    const result = wrapper.getConfiguration('section', 'key', 'デフォルト値');

    expect(vscode.workspace.getConfiguration).toHaveBeenCalledWith('section');
    expect(getMock).toHaveBeenCalledWith('key');
    expect(result).toBe('設定値');
  });

  it('getConfigurationが設定値がnullの場合デフォルト値を返すこと', () => {
    const getMock = vi.fn().mockReturnValue(null);
    vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({ get: getMock });

    const result = wrapper.getConfiguration('section', 'key', 'デフォルト値');

    expect(result).toBe('デフォルト値');
  });

  it('writeClipboardがテキストをクリップボードに書き込むこと', async () => {
    await wrapper.writeClipboard('コピーテキスト');
    expect(vscode.env.clipboard.writeText).toHaveBeenCalledWith('コピーテキスト');
  });

  it('disposeが出力チャンネルを破棄すること', () => {
    wrapper.dispose();
    expect(mockOutputChannel.dispose).toHaveBeenCalled();
  });
});
