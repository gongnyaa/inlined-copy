// inlinedCopyService.ts

import { FileExpander } from '../FileExpander';
import { VSCodeWrapper } from '../utils/VSCodeWrapper';
import { LogWrapper } from '../utils/LogWrapper';
import { EditorTextService } from './EditorTextService';
import { TextNotFoundException } from '../errors/ErrorTypes';
import { t } from '../utils/I18n';
import { MESSAGE_KEYS } from '../constants/Messages';

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
      LogWrapper.Instance().notify(t(MESSAGE_KEYS.COPY_SUCCESS));
    } catch (error) {
      if (error instanceof TextNotFoundException) {
        LogWrapper.Instance().notify(t(MESSAGE_KEYS.TEXT_NOT_FOUND));
        return;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      LogWrapper.Instance().error(t(MESSAGE_KEYS.UNEXPECTED_ERROR, { message: errorMessage }));
    }
  }
}
