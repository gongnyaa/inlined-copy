import { TextNotFoundException } from '../errors/ErrorTypes';
import { VSCodeWrapper } from '../utils/VSCodeWrapper';
import { MESSAGE_KEYS } from '../constants/Messages';
import { t } from '../utils/I18n';
import { SingletonBase } from '../utils/SingletonBase';

export interface IEditorTextService {
  /**
   * アクティブなエディタからテキストを取得する
   * @returns 取得したテキストと現在のディレクトリのパス
   * @throws TextNotFoundException テキストが見つからない場合にスローされる
   */
  getTextFromEditor(): Promise<{ text: string; currentDir: string }>;
}

export class EditorTextService
  extends SingletonBase<IEditorTextService>
  implements IEditorTextService
{
  public async getTextFromEditor(): Promise<{ text: string; currentDir: string }> {
    const selectionResult = VSCodeWrapper.Instance().getSelectionText();
    if (selectionResult.text) {
      return { text: selectionResult.text, currentDir: selectionResult.currentDir };
    }

    const documentResult = VSCodeWrapper.Instance().getDocumentText();
    if (!documentResult.text) {
      throw new TextNotFoundException(t(MESSAGE_KEYS.TEXT_NOT_FOUND));
    }

    return { text: documentResult.text, currentDir: documentResult.currentDir };
  }
}
