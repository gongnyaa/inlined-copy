import { TextNotFoundException } from '../errors/ErrorTypes';
import { VSCodeWrapper } from '../utils/VSCodeWrapper';
import { MESSAGE_KEYS } from '../constants/Messages';
import { t } from '../utils/I18n';

export interface IEditorTextService {
  /**
   * アクティブなエディタからテキストを取得する
   * @returns 取得したテキストと現在のディレクトリのパス
   * @throws TextNotFoundException テキストが見つからない場合にスローされる
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
    const editor = VSCodeWrapper.Instance().getActiveTextEditor();
    if (!editor) {
      throw new TextNotFoundException(t(MESSAGE_KEYS.TEXT_NOT_FOUND));
    }

    const { text, currentDir } = VSCodeWrapper.Instance().getEditorText(editor);

    if (!text) {
      throw new TextNotFoundException(t(MESSAGE_KEYS.TEXT_NOT_FOUND));
    }

    return { text, currentDir };
  }
}
