import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogManager } from './logManager';
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
    },
  };
});

// 後でテスト中にモックを取得
let mockCreateOutputChannel: any;
let mockAppendLine: any;
let mockShow: any;
let mockDispose: any;

let mockContext: any;

describe('LogManager 機能テスト', () => {
  beforeEach(() => {
    // テスト前にモックを取得
    mockCreateOutputChannel = vscode.window.createOutputChannel;
    mockAppendLine = mockCreateOutputChannel().appendLine;
    mockShow = mockCreateOutputChannel().show;
    mockDispose = mockCreateOutputChannel().dispose;

    // モックをリセット
    vi.clearAllMocks();

    // privateな静的プロパティをリセット
    (LogManager as any).outputChannel = undefined;
    mockContext = {
      subscriptions: [],
    };
  });

  it('初期化時に出力チャンネルを作成し、正しく初期化すること', () => {
    LogManager.initialize(mockContext as any);

    expect(mockCreateOutputChannel).toHaveBeenCalledWith('Inlined Copy');
    expect(mockCreateOutputChannel).toHaveBeenCalledTimes(1);
    expect(mockContext.subscriptions.length).toBe(1);
    expect(mockAppendLine).toHaveBeenCalledWith('[Inlined Copy] initialized');
  });

  it('複数回初期化しても出力チャンネルが重複して作成されないこと', () => {
    vi.clearAllMocks();
    LogManager.initialize(mockContext as any);
    LogManager.initialize(mockContext as any);

    expect(mockCreateOutputChannel).toHaveBeenCalledTimes(1);
    expect(mockContext.subscriptions.length).toBe(1);
  });

  it('初期化後にログメッセージをプレフィックス付きで出力すること', () => {
    (LogManager as any).outputChannel = mockCreateOutputChannel();

    LogManager.log('テストメッセージ');

    expect(mockAppendLine).toHaveBeenCalledWith('[Inlined Copy] テストメッセージ');
    expect(mockAppendLine).toHaveBeenCalledTimes(1);
  });

  it('エラーメッセージを出力し、出力チャンネルを表示すること', () => {
    (LogManager as any).outputChannel = mockCreateOutputChannel();
    LogManager.error('エラーメッセージ');

    expect(mockAppendLine).toHaveBeenCalledWith('[Inlined Copy] ERROR エラーメッセージ');
    expect(mockShow).toHaveBeenCalled();
  });

  it('出力チャンネルを正しく破棄すること', () => {
    // const mockContext = {
    //   subscriptions: [],
    // };

    // LogManager.initialize(mockContext as any);
    // vi.clearAllMocks();
    (LogManager as any).outputChannel = mockCreateOutputChannel();

    LogManager.dispose();

    expect(mockDispose).toHaveBeenCalled();

    LogManager.log('破棄後のテスト');
    expect(mockAppendLine).not.toHaveBeenCalled();
  });
});
