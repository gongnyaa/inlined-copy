import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InlinedCopyService } from './InlinedCopyService';
import { EditorTextService } from './EditorTextService';
import { FileExpander } from '../FileExpander';
import { VSCodeWrapper } from '../utils/VSCodeWrapper';
import { LogWrapper } from '../utils/LogWrapper';
import { mockEditorTextService } from './EditorTextService.mock';
import { mockFileExpander } from '../FileExpander.mock';
import { mockVSCodeWrapper } from '../utils/VSCodeWrapper.mock';
import { mockLogWrapper } from '../utils/LogWrapper.mock';
import { TextNotFoundException } from '../errors/ErrorTypes';
import { t } from '../utils/I18n';
import { MESSAGE_KEYS } from '../constants/Messages';

const mockTextFromEditor = 'mockTextFromEditor';
const mockCurrentDirFromEditor = '/test/dir';
const mockExpandedText = 'mockExpandedText';

describe('InlinedCopyService', () => {
  let target: InlinedCopyService;

  beforeEach(() => {
    vi.clearAllMocks();
    (mockEditorTextService.getTextFromEditor as any).mockResolvedValue({
      text: mockTextFromEditor,
      currentDir: mockCurrentDirFromEditor,
    });

    EditorTextService.SetInstance(mockEditorTextService);
    (mockFileExpander.expandFileReferences as any).mockResolvedValue(mockExpandedText);

    FileExpander.SetInstance(mockFileExpander);
    VSCodeWrapper.SetInstance(mockVSCodeWrapper);
    LogWrapper.SetInstance(mockLogWrapper);

    target = new InlinedCopyService();
  });

  it('executeCommand_Happy', async () => {
    // Do
    await target.executeCommand();

    // Verify
    expect(mockEditorTextService.getTextFromEditor).toHaveBeenCalledTimes(1);
    expect(mockFileExpander.expandFileReferences).toHaveBeenCalledWith(
      mockTextFromEditor,
      mockCurrentDirFromEditor
    );
    expect(mockVSCodeWrapper.writeClipboard).toHaveBeenCalledWith(mockExpandedText);
    expect(mockLogWrapper.notify).toHaveBeenCalledWith(t(MESSAGE_KEYS.COPY_SUCCESS));
  });

  it('executeCommand_Error_TextNotFound', async () => {
    // モックの設定
    // テスト用に一時的にモックの実装を上書き
    (mockEditorTextService.getTextFromEditor as any).mockImplementationOnce(() => {
      return Promise.reject(new TextNotFoundException(t(MESSAGE_KEYS.TEXT_NOT_FOUND)));
    });

    // 実行
    await target.executeCommand();

    // 検証
    expect(mockLogWrapper.notify).toHaveBeenCalledWith(t(MESSAGE_KEYS.TEXT_NOT_FOUND));
    expect(mockFileExpander.expandFileReferences).not.toHaveBeenCalled();
    expect(mockVSCodeWrapper.writeClipboard).not.toHaveBeenCalled();
  });

  it('executeCommand_Error_UnexpectedError', async () => {
    // モックの設定
    const testError = new Error('テストエラー');
    // テスト用に一時的にモックの実装を上書き
    (mockEditorTextService.getTextFromEditor as any).mockImplementationOnce(() => {
      return Promise.reject(testError);
    });

    // 実行
    await target.executeCommand();

    // 検証
    expect(mockLogWrapper.error).toHaveBeenCalledWith(
      t(MESSAGE_KEYS.UNEXPECTED_ERROR, { message: 'テストエラー' })
    );
    expect(mockFileExpander.expandFileReferences).not.toHaveBeenCalled();
    expect(mockVSCodeWrapper.writeClipboard).not.toHaveBeenCalled();
  });
});
