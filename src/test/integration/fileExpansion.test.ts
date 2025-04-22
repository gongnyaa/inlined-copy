import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { InlinedCopyService } from '../../services/InlinedCopyService';
import { EditorTextService } from '../../services/EditorTextService';
import { VSCodeWrapper } from '../../utils/VSCodeWrapper';
import { FileExpanderService } from '../../services/FileExpanderService';

// fsモジュールの実際の実装を使用するためのモック設定
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
  };
});

describe('File Expansion Integration Test', () => {
  const examplesDir = path.resolve(__dirname, '../../../examples');
  const mainMdPath = path.join(examplesDir, 'main.md');
  const expectedMainMdPath = path.join(examplesDir, 'expected_main.md');

  let originalGetTextFromEditor: any;
  let originalWriteClipboard: any;
  let originalExpandFileReferences: any;
  let processedText = '';

  beforeEach(() => {
    // テスト用のファイルが存在することを確認
    expect(fs.existsSync(mainMdPath)).toBeTruthy();
    expect(fs.existsSync(expectedMainMdPath)).toBeTruthy();

    // main.mdの内容を取得
    const mockText = fs.readFileSync(mainMdPath, 'utf8');
    const mockCurrentDir = path.dirname(mainMdPath);
    const expectedText = fs.readFileSync(expectedMainMdPath, 'utf8');

    // EditorTextServiceのgetTextFromEditorをモック化
    originalGetTextFromEditor = EditorTextService.Instance().getTextFromEditor;
    EditorTextService.Instance().getTextFromEditor = vi.fn().mockResolvedValue({
      text: mockText,
      currentDir: mockCurrentDir,
    });

    // FileExpanderServiceのexpandFileReferencesをモック化
    originalExpandFileReferences = FileExpanderService.Instance().expandFileReferences;
    FileExpanderService.Instance().expandFileReferences = vi.fn().mockResolvedValue(expectedText);

    // VSCodeWrapperのwriteClipboardをモック化して結果を取得
    processedText = '';
    originalWriteClipboard = VSCodeWrapper.Instance().writeClipboard;
    VSCodeWrapper.Instance().writeClipboard = vi.fn().mockImplementation(async (text: string) => {
      processedText = text;
      return Promise.resolve();
    });
  });

  afterEach(() => {
    // モックを元に戻す
    EditorTextService.Instance().getTextFromEditor = originalGetTextFromEditor;
    FileExpanderService.Instance().expandFileReferences = originalExpandFileReferences;
    VSCodeWrapper.Instance().writeClipboard = originalWriteClipboard;
  });

  it('should expand file references correctly', async () => {
    // InlinedCopyServiceのexecuteCommandを実行
    await InlinedCopyService.Instance().executeCommand();

    // 期待される結果を取得
    const expectedText = fs.readFileSync(expectedMainMdPath, 'utf8');

    // 結果を検証
    expect(processedText).toBe(expectedText);
  });
});
