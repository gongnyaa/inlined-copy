// inlinedCopyService.ts

import { FileExpander } from '../fileExpander';
import { VSCodeWrapper } from '../utils/vSCodeWrapper';
import { LogWrapper } from '../utils/logWrapper';
import { EditorTextService } from './editorTextService';
import { TextNotFoundException } from '../errors/errorTypes';

export interface IInlinedCopyService {
  executeCommand(): Promise<void>;
}

export class InlinedCopyService implements IInlinedCopyService {
  private static _instance: IInlinedCopyService;

  public static Instance(): IInlinedCopyService {
    if (!this._instance) {
      this._instance = new InlinedCopyService();
    }
    return this._instance;
  }

  public static SetInstance(instance: IInlinedCopyService): void {
    this._instance = instance;
  }

  public async executeCommand(): Promise<void> {
    try {
      const { text, currentDir } = await EditorTextService.Instance().getTextFromEditor();
      const processedText = await FileExpander.Instance().expandFileReferences(text, currentDir);
      await VSCodeWrapper.Instance().writeClipboard(processedText);
      LogWrapper.Instance().notify(
        '展開された参照を含むテキストがクリップボードにコピーされました'
      );
    } catch (error) {
      if (error instanceof TextNotFoundException) {
        LogWrapper.Instance().notify('コピー元のテキストが見つかりませんでした');
        return;
      }
      LogWrapper.Instance().error(
        `予期せぬエラー: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
