// src/utils/vSCodeWrapper.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VSCodeWrapper } from './VSCodeWrapper';
import * as path from 'path';

vi.mock('vscode', () => {
  const mockOutputChannel = {
    appendLine: vi.fn(),
    show: vi.fn(),
    dispose: vi.fn(),
  };

  const mockSelection = {
    isEmpty: true,
  };

  const mockDocument = {
    getText: vi.fn(),
    uri: {
      fsPath: '/test/path/file.md',
    },
  };

  const mockEditor = {
    selection: mockSelection,
    document: mockDocument,
  };

  const mockVSCode = {
    window: {
      createOutputChannel: vi.fn().mockReturnValue(mockOutputChannel),
      showInformationMessage: vi.fn().mockResolvedValue(undefined),
      showErrorMessage: vi.fn().mockResolvedValue(undefined),
      activeTextEditor: mockEditor,
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
  let mockDocument: any;
  let mockSelection: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vscode = await import('vscode');
    mockOutputChannel = (await import('vscode')).window.createOutputChannel('Test Channel');
    mockDocument = vscode.window.activeTextEditor.document;
    mockSelection = vscode.window.activeTextEditor.selection;

    wrapper = new VSCodeWrapper();
  });

  it('appendLine,needShow false', () => {
    wrapper.appendLine('テストメッセージ', false);
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith('テストメッセージ');
    expect(mockOutputChannel.show).not.toHaveBeenCalled();
  });

  it('appendLine,needShow true', () => {
    wrapper.appendLine('テストメッセージ', true);
    expect(mockOutputChannel.appendLine).toHaveBeenCalledWith('テストメッセージ');
    expect(mockOutputChannel.show).toHaveBeenCalled();
  });

  it('showInformationMessage', async () => {
    await wrapper.showInformationMessage('情報メッセージ');
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('情報メッセージ');
  });

  it('showErrorMessage', async () => {
    await wrapper.showErrorMessage('エラーメッセージ');
    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('エラーメッセージ');
  });

  it('getConfiguration,が設定値を正しく取得すること', () => {
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

  it('getSelectionText_WithSelection_ReturnsText', () => {
    mockSelection.isEmpty = false;
    mockDocument.getText.mockReturnValue('Selected Text');

    const result = wrapper.getSelectionText();

    expect(result.text).toBe('Selected Text');
    expect(result.currentDir).toBe('/test/path');
    expect(mockDocument.getText).toHaveBeenCalledWith(mockSelection);
  });

  it('getSelectionText_NoSelection_ReturnsNull', () => {
    mockSelection.isEmpty = true;

    const result = wrapper.getSelectionText();

    expect(result.text).toBeNull();
    expect(result.currentDir).toBe('');
  });

  it('getDocumentText_WithEditor_ReturnsText', () => {
    mockDocument.getText.mockReturnValue('Document Text');

    const result = wrapper.getDocumentText();

    expect(result.text).toBe('Document Text');
    expect(result.currentDir).toBe('/test/path');
    expect(mockDocument.getText).toHaveBeenCalledWith();
  });

  it('disposeが出力チャンネルを破棄すること', () => {
    wrapper.dispose();
    expect(mockOutputChannel.dispose).toHaveBeenCalled();
  });
});
