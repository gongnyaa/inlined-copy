import { TextNotFoundError } from '../errors/ErrorTypes';
import { VSCodeWrapper } from '../utils/VSCodeWrapper';
import { MESSAGE_KEYS } from '../constants/Messages';
import { t } from '../utils/I18n';
import { SingletonBase } from '../utils/SingletonBase';

export interface IEditorTextService {
  /**
   * アクティブなエディタからテキストを取得する
   * @returns 取得したテキストと現在のディレクトリのパス
   * @throws TextNotFoundError テキストが見つからない場合にスローされる
   */
  getTextFromEditor(): Promise<{ text: string; currentDir: string }>;
}

export class EditorTextService
  extends SingletonBase<IEditorTextService>
  implements IEditorTextService
{
  public async getTextFromEditor(): Promise<{ text: string; currentDir: string }> {
    const { text, currentDir } = VSCodeWrapper.Instance().getSelectionText();
    if (text) {
      return { text, currentDir };
    }

    const { text: documentText, currentDir: documentCurrentDir } =
      VSCodeWrapper.Instance().getDocumentText();
    if (documentText) {
      return { text: documentText, currentDir: documentCurrentDir };
    }

    throw new TextNotFoundError(t(MESSAGE_KEYS.TEXT_NOT_FOUND));
  }
}
