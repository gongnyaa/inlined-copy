// inlinedCopyService.ts

import { FileExpander } from '../fileExpander';
import { VSCodeEnvironment } from '../utils/vscodeEnvironment';
import { LogManager } from '../utils/logManager';
import { EditorTextService, IEditorTextService } from './editorTextService';

export class InlinedCopyService {
  private readonly editorTextService: IEditorTextService;

  constructor(editorTextService?: IEditorTextService) {
    this.editorTextService = editorTextService || new EditorTextService();
  }

  public async executeCommand(): Promise<void> {
    try {
      // エディタからテキストを取得
      const editorContent = await this.editorTextService.getTextFromEditor();
      if (!editorContent) {
        return;
      }

      const { text, currentDir } = editorContent;

      // テキストを処理 - ファイル参照を展開
      const processedText = await FileExpander.expandFileReferences(text, currentDir);

      // 処理されたテキストをクリップボードにコピー
      await VSCodeEnvironment.writeClipboard(processedText);
      LogManager.log('展開された参照を含むテキストがクリップボードにコピーされました');
    } catch (error) {
      LogManager.error(`エラー: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 静的ファクトリメソッド - デフォルトの実装でインスタンスを作成
   * @returns InlinedCopyServiceのインスタンス
   */
  public static createDefault(): InlinedCopyService {
    return new InlinedCopyService();
  }
}
