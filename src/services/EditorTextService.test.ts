import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditorTextService } from './EditorTextService';
import { TextNotFoundException } from '../errors/ErrorTypes';
import * as path from 'path';

vi.mock('vscode', () => {
  return {
    window: {
      activeTextEditor: undefined,
    },
  };
});

describe('EditorTextService', () => {
  let target: EditorTextService;
  let vscode: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vscode = await import('vscode');
    target = new EditorTextService();
  });

  it('getTextFromEditor_HappyPath', async () => {
    const mockSelection = {
      isEmpty: true,
    };
    const mockDocument = {
      getText: vi.fn().mockReturnValue('テストテキスト'),
      uri: {
        fsPath: '/test/path/file.md',
      },
    };
    vi.mocked(vscode.window).activeTextEditor = {
      selection: mockSelection,
      document: mockDocument,
    } as any;

    const result = await target.getTextFromEditor();

    expect(result.text).toBe('テストテキスト');
    expect(result.currentDir).toBe('/test/path');
    expect(mockDocument.getText).toHaveBeenCalledTimes(1);
  });

  it('getTextFromEditor_HappyPath_選択範囲あり', async () => {
    const mockSelection = {
      isEmpty: false,
    };
    const mockDocument = {
      getText: vi.fn().mockImplementation(selection => {
        return selection ? '選択テキスト' : 'すべてのテキスト';
      }),
      uri: {
        fsPath: '/test/path/file.md',
      },
    };
    vi.mocked(vscode.window).activeTextEditor = {
      selection: mockSelection,
      document: mockDocument,
    } as any;

    const result = await target.getTextFromEditor();

    expect(result.text).toBe('選択テキスト');
    expect(result.currentDir).toBe('/test/path');
    expect(mockDocument.getText).toHaveBeenCalledTimes(1);
    expect(mockDocument.getText).toHaveBeenCalledWith(mockSelection);
  });

  it('getTextFromEditor_アクティブエディタが存在しない場合_TextNotFoundExceptionをスロー', async () => {
    vi.mocked(vscode.window).activeTextEditor = null;

    await expect(target.getTextFromEditor()).rejects.toThrow(TextNotFoundException);
    await expect(target.getTextFromEditor()).rejects.toThrow(
      'アクティブなエディタが見つかりません'
    );
  });

  it('getTextFromEditor_テキストが空の場合_TextNotFoundExceptionをスロー', async () => {
    const mockSelection = {
      isEmpty: true,
    };
    const mockDocument = {
      getText: vi.fn().mockReturnValue(''),
      uri: {
        fsPath: '/test/path/file.md',
      },
    };
    vi.mocked(vscode.window).activeTextEditor = {
      selection: mockSelection,
      document: mockDocument,
    } as any;

    await expect(target.getTextFromEditor()).rejects.toThrow(TextNotFoundException);
    await expect(target.getTextFromEditor()).rejects.toThrow('コピーするするテキストがありません');
  });
});
