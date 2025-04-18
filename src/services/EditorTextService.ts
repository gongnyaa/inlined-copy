import { TextNotFoundError } from '../errors/ErrorTypes';
import { VSCodeWrapper } from '../utils/VSCodeWrapper';
import { MESSAGE_KEYS } from '../constants/Messages';
import { t } from '../utils/I18n';

export interface IEditorTextService {
  /**
   * アクティブなエディタからテキストを取得する
   * @returns 取得したテキストと現在のディレクトリのパス
   * @throws TextNotFoundError テキストが見つからない場合にスローされる
   */
  getTextFromEditor(): Promise<{ text: string; currentDir: string }>;
}

export class EditorTextService implements IEditorTextService {
  private static _instance: IEditorTextService;

  public static Instance(): IEditorTextService {
    if (!this._instance) {
      this._instance = new EditorTextService();
    }
    return this._instance;
  }
  public static SetInstance(instance: IEditorTextService): void {
    this._instance = instance;
  }

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
