// inlinedCopyService.ts

import { FileExpander, IFileExpander } from '../fileExpander';
import { VSCodeEnvironment } from '../utils/vscodeEnvironment';
import { LogManager } from '../utils/logManager';
import { EditorTextService, IEditorTextService } from './editorTextService';
import { TextNotFoundException } from '../errors/errorTypes';

export class InlinedCopyService {
  public async executeCommand(
    editorTextService: IEditorTextService = new EditorTextService(),
    fileExpander: IFileExpander = new FileExpander()
  ): Promise<void> {
    try {
      const { text, currentDir } = await editorTextService.getTextFromEditor();
      const processedText = await fileExpander.expandFileReferences(text, currentDir, [], 0);
      await VSCodeEnvironment.writeClipboard(processedText);
      LogManager.notify('展開された参照を含むテキストがクリップボードにコピーされました');
    } catch (error) {
      if (error instanceof TextNotFoundException) {
        LogManager.notify('コピー元のテキストが見つかりませんでした');
        return;
      }
      LogManager.error(`予期せぬエラー: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
