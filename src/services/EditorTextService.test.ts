import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditorTextService } from './EditorTextService';
import { VSCodeWrapper } from '../utils/VSCodeWrapper';
import { mockVSCodeWrapper } from '../utils/VSCodeWrapper.mock';
import { TextNotFoundError } from '../errors/ErrorTypes';
import { MESSAGE_KEYS } from '../constants/Messages';
import { t } from '../utils/I18n';

vi.mock('vscode', () => {
  return {
    window: {
      activeTextEditor: null,
      showInformationMessage: vi.fn(),
      createOutputChannel: vi.fn(),
    },
    workspace: {
      getConfiguration: vi.fn(),
    },
  };
});

vi.mock('../utils/I18n', () => ({
  t: vi.fn(key => {
    if (key === MESSAGE_KEYS.TEXT_NOT_FOUND) {
      return 'コピー元のテキストが見つかりませんでした';
    }
    return key;
  }),
}));

describe('EditorTextService', () => {
  let target: EditorTextService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockVSCodeWrapper.getSelectionText = vi.fn().mockReturnValue({ text: null, currentDir: '' });
    mockVSCodeWrapper.getDocumentText = vi.fn().mockReturnValue({ text: null, currentDir: '' });

    VSCodeWrapper.SetInstance(mockVSCodeWrapper);

    target = new EditorTextService();
  });

  it('getTextFromEditor_WithSelection_ReturnsSelectedText', async () => {
    vi.mocked(mockVSCodeWrapper.getSelectionText).mockReturnValue({
      text: 'Selected Text Content',
      currentDir: '/test/path',
    });

    const result = await target.getTextFromEditor();

    expect(result.text).toBe('Selected Text Content');
    expect(result.currentDir).toBe('/test/path');
    expect(mockVSCodeWrapper.getSelectionText).toHaveBeenCalledTimes(1);
    expect(mockVSCodeWrapper.getDocumentText).not.toHaveBeenCalled();
  });

  it('getTextFromEditor_WithoutSelection_ReturnsDocumentText', async () => {
    vi.mocked(mockVSCodeWrapper.getSelectionText).mockReturnValue({
      text: null,
      currentDir: '',
    });

    vi.mocked(mockVSCodeWrapper.getDocumentText).mockReturnValue({
      text: 'Document Text Content',
      currentDir: '/test/path',
    });

    const result = await target.getTextFromEditor();

    expect(result.text).toBe('Document Text Content');
    expect(result.currentDir).toBe('/test/path');
    expect(mockVSCodeWrapper.getSelectionText).toHaveBeenCalledTimes(1);
    expect(mockVSCodeWrapper.getDocumentText).toHaveBeenCalledTimes(1);
  });

  it('getTextFromEditor_NoEditor_ThrowsTextNotFoundError', async () => {
    vi.mocked(mockVSCodeWrapper.getSelectionText).mockReturnValue({
      text: null,
      currentDir: '',
    });

    vi.mocked(mockVSCodeWrapper.getDocumentText).mockReturnValue({
      text: null,
      currentDir: '',
    });

    await expect(target.getTextFromEditor()).rejects.toThrow(TextNotFoundError);
    expect(t).toHaveBeenCalledWith(MESSAGE_KEYS.TEXT_NOT_FOUND);
  });

  it('getTextFromEditor_EmptyText_ThrowsTextNotFoundError', async () => {
    vi.mocked(mockVSCodeWrapper.getSelectionText).mockReturnValue({
      text: null,
      currentDir: '',
    });

    vi.mocked(mockVSCodeWrapper.getDocumentText).mockReturnValue({
      text: '',
      currentDir: '/test/path',
    });

    await expect(target.getTextFromEditor()).rejects.toThrow(TextNotFoundError);
    expect(t).toHaveBeenCalledWith(MESSAGE_KEYS.TEXT_NOT_FOUND);
  });
});
