import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InlinedCopyService } from './InlinedCopyService';
import { EditorTextService } from './EditorTextService';
import { FileExpanderService } from './FileExpanderService';
import { VSCodeWrapper } from '../utils/VSCodeWrapper';
import { LogWrapper } from '../utils/LogWrapper';
import { mockEditorTextService } from './EditorTextService.mock';
import { mockFileExpanderService } from './FileExpanderService.mock';
import { mockVSCodeWrapper } from '../utils/VSCodeWrapper.mock';
import { mockLogWrapper } from '../utils/LogWrapper.mock';
import { TextNotFoundError } from '../errors/ErrorTypes';
import { t } from '../utils/I18n';
import { MESSAGE_KEYS } from '../constants/Messages';

vi.mock('vscode', () => {
  return {
    window: {
      showInformationMessage: vi.fn(),
      createOutputChannel: vi.fn().mockReturnValue({
        appendLine: vi.fn(),
        show: vi.fn(),
      }),
    },
    workspace: {
      getConfiguration: vi.fn(),
    },
  };
});

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
    (mockFileExpanderService.expandFileReferences as any).mockResolvedValue(mockExpandedText);

    FileExpanderService.SetInstance(mockFileExpanderService);
    VSCodeWrapper.SetInstance(mockVSCodeWrapper);
    LogWrapper.SetInstance(mockLogWrapper);

    target = new InlinedCopyService();
  });

  it('executeCommand_Happy', async () => {
    // Do
    await target.executeCommand();

    // Verify
    expect(mockEditorTextService.getTextFromEditor).toHaveBeenCalledTimes(1);
    expect(mockFileExpanderService.expandFileReferences).toHaveBeenCalledWith(
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
      return Promise.reject(new TextNotFoundError(t(MESSAGE_KEYS.TEXT_NOT_FOUND)));
    });

    // 実行
    await target.executeCommand();

    // 検証
    expect(mockLogWrapper.notify).toHaveBeenCalledWith(t(MESSAGE_KEYS.TEXT_NOT_FOUND));
    expect(mockFileExpanderService.expandFileReferences).not.toHaveBeenCalled();
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
    expect(mockFileExpanderService.expandFileReferences).not.toHaveBeenCalled();
    expect(mockVSCodeWrapper.writeClipboard).not.toHaveBeenCalled();
  });
});
