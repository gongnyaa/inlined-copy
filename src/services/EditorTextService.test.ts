import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { EditorTextService } from './EditorTextService';
import { VSCodeWrapper } from '../utils/VSCodeWrapper';
import {
  mockVSCodeWrapper,
  MOCK_SELECTION_TEXT,
  MOCK_DOCUMENT_TEXT,
  MOCK_NULL_TEXT,
} from '../utils/VSCodeWrapper.mock';
import { TEST_ERRORS } from '../constants/TestMessages';
import { TextNotFoundError } from '../errors/ErrorTypes';
import { MESSAGE_KEYS } from '../constants/Messages';
import { t } from '../utils/I18n';
import { fail } from 'assert';

describe('EditorTextService', () => {
  let target: EditorTextService;

  beforeEach(() => {
    vi.clearAllMocks();
    VSCodeWrapper.SetInstance(mockVSCodeWrapper);
    target = new EditorTextService();
  });

  it('getTextFromEditor_HappyPath_ReturnsSelectedText', async () => {
    const result = await target.getTextFromEditor();

    expect(result.text).toBe(MOCK_SELECTION_TEXT.text);
    expect(result.currentDir).toBe(MOCK_SELECTION_TEXT.currentDir);
    expect(mockVSCodeWrapper.getDocumentText).not.toHaveBeenCalled();
  });

  it('getTextFromEditor_HappyPath_ReturnsDocumentText', async () => {
    (mockVSCodeWrapper.getSelectionText as Mock).mockReturnValue(MOCK_NULL_TEXT);

    const result = await target.getTextFromEditor();

    expect(result.text).toBe(MOCK_DOCUMENT_TEXT.text);
    expect(result.currentDir).toBe(MOCK_DOCUMENT_TEXT.currentDir);
    expect(mockVSCodeWrapper.getSelectionText).toHaveBeenCalledWith();
    expect(mockVSCodeWrapper.getDocumentText).toHaveBeenCalledWith();
  });

  it('getTextFromEditor_Error_ThrowsTextNotFoundError', async () => {
    vi.mocked(mockVSCodeWrapper.getSelectionText).mockReturnValue(MOCK_NULL_TEXT);
    vi.mocked(mockVSCodeWrapper.getDocumentText).mockReturnValue(MOCK_NULL_TEXT);

    try {
      await target.getTextFromEditor();
      fail(TEST_ERRORS.NO_EXCEPTION);
    } catch (error) {
      if (error instanceof TextNotFoundError) {
        expect(error.message).toEqual(t(MESSAGE_KEYS.TEXT_NOT_FOUND));
      } else {
        fail(TEST_ERRORS.WRONG_EXCEPTION_TYPE);
      }
    }
    expect(mockVSCodeWrapper.getSelectionText).toHaveBeenCalledWith();
    expect(mockVSCodeWrapper.getDocumentText).toHaveBeenCalledWith();
  });
});
