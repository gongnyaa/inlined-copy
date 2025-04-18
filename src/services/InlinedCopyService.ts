// inlinedCopyService.ts

import { FileExpanderService } from './FileExpanderService';
import { VSCodeWrapper } from '../utils/VSCodeWrapper';
import { LogWrapper } from '../utils/LogWrapper';
import { EditorTextService } from './EditorTextService';
import { TextNotFoundError } from '../errors/ErrorTypes';
import { t } from '../utils/I18n';
import { MESSAGE_KEYS } from '../constants/Messages';
import { SingletonBase } from '../utils/SingletonBase';

export interface IInlinedCopyService {
  executeCommand(): Promise<void>;
}

export class InlinedCopyService
  extends SingletonBase<IInlinedCopyService>
  implements IInlinedCopyService
{
  public async executeCommand(): Promise<void> {
    try {
      const { text, currentDir } = await EditorTextService.Instance().getTextFromEditor();
      const processedText = await FileExpanderService.Instance().expandFileReferences(
        text,
        currentDir
      );
      await VSCodeWrapper.Instance().writeClipboard(processedText);
      LogWrapper.Instance().notify(t(MESSAGE_KEYS.COPY_SUCCESS));
    } catch (error) {
      if (error instanceof TextNotFoundError) {
        LogWrapper.Instance().notify(t(MESSAGE_KEYS.TEXT_NOT_FOUND));
        return;
      }
      const errorMessage = String(error);
      LogWrapper.Instance().error(t(MESSAGE_KEYS.UNEXPECTED_ERROR, { message: errorMessage }));
    }
  }
}
