import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditorTextService } from './EditorTextService';
import { VSCodeWrapper } from '../utils/VSCodeWrapper';
import { mockVSCodeWrapper } from '../utils/VSCodeWrapper.mock';
import { TextNotFoundException } from '../errors/ErrorTypes';
import { MESSAGE_KEYS } from '../constants/Messages';
import { t } from '../utils/I18n';

vi.mock('../utils/I18n', () => ({
  t: vi.fn((key) => {
    if (key === MESSAGE_KEYS.TEXT_NOT_FOUND) {
      return 'コピー元のテキストが見つかりませんでした';
    }
    return key;
  }),
}));

describe('EditorTextService', () => {
  let target: EditorTextService;
  let mockEditor: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockEditor = {
      selection: {
        isEmpty: true,
      },
      document: {
        getText: vi.fn(),
        uri: {
          fsPath: '/test/path/file.md',
        },
      },
    };
    
    mockVSCodeWrapper.getActiveTextEditor = vi.fn();
    mockVSCodeWrapper.getEditorText = vi.fn();
    
    VSCodeWrapper.SetInstance(mockVSCodeWrapper);
    
    target = new EditorTextService();
  });

  it('getTextFromEditor_WithFullDocument_ReturnsAllText', async () => {
    vi.mocked(mockVSCodeWrapper.getActiveTextEditor).mockReturnValue(mockEditor);
    vi.mocked(mockVSCodeWrapper.getEditorText).mockReturnValue({
      text: 'Test Text Content',
      currentDir: '/test/path',
    });

    const result = await target.getTextFromEditor();

    expect(result.text).toBe('Test Text Content');
    expect(result.currentDir).toBe('/test/path');
    expect(mockVSCodeWrapper.getActiveTextEditor).toHaveBeenCalledTimes(1);
    expect(mockVSCodeWrapper.getEditorText).toHaveBeenCalledWith(mockEditor);
  });

  it('getTextFromEditor_WithSelection_ReturnsSelectedText', async () => {
    mockEditor.selection.isEmpty = false;
    
    vi.mocked(mockVSCodeWrapper.getActiveTextEditor).mockReturnValue(mockEditor);
    vi.mocked(mockVSCodeWrapper.getEditorText).mockReturnValue({
      text: 'Selected Text Content',
      currentDir: '/test/path',
    });

    const result = await target.getTextFromEditor();

    expect(result.text).toBe('Selected Text Content');
    expect(result.currentDir).toBe('/test/path');
    expect(mockVSCodeWrapper.getActiveTextEditor).toHaveBeenCalledTimes(1);
    expect(mockVSCodeWrapper.getEditorText).toHaveBeenCalledWith(mockEditor);
  });

  it('getTextFromEditor_NoActiveEditor_ThrowsTextNotFoundException', async () => {
    vi.mocked(mockVSCodeWrapper.getActiveTextEditor).mockReturnValue(undefined);

    await expect(target.getTextFromEditor()).rejects.toThrow(TextNotFoundException);
    expect(t).toHaveBeenCalledWith(MESSAGE_KEYS.TEXT_NOT_FOUND);
  });

  it('getTextFromEditor_EmptyText_ThrowsTextNotFoundException', async () => {
    vi.mocked(mockVSCodeWrapper.getActiveTextEditor).mockReturnValue(mockEditor);
    vi.mocked(mockVSCodeWrapper.getEditorText).mockReturnValue({
      text: '',
      currentDir: '/test/path',
    });

    await expect(target.getTextFromEditor()).rejects.toThrow(TextNotFoundException);
    expect(t).toHaveBeenCalledWith(MESSAGE_KEYS.TEXT_NOT_FOUND);
  });
});
