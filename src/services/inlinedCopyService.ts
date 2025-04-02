// inlinedCopyService.ts

import { FileExpander, IFileExpander } from '../fileExpander';
import { IVSCodeWrapper, VSCodeWrapper } from '../utils/VSCodeWrapper';
import { LogWrapper } from '../utils/logWrapper';
import { EditorTextService, IEditorTextService } from './editorTextService';
import { TextNotFoundException } from '../errors/errorTypes';

export interface IInlinedCopyService {
  executeCommand(): Promise<void>;
}

export class InlinedCopyService implements IInlinedCopyService {
  private static _instance: IInlinedCopyService;
  private _editorTextService: IEditorTextService;
  private _fileExpander: IFileExpander;
  private _vscodeEnvironment: IVSCodeWrapper;

  constructor(
    editorTextService: IEditorTextService = new EditorTextService(),
    fileExpander: IFileExpander = new FileExpander(),
    vscodeEnvironment: IVSCodeWrapper = VSCodeWrapper.Instance()
  ) {
    this._editorTextService = editorTextService;
    this._fileExpander = fileExpander;
    this._vscodeEnvironment = vscodeEnvironment;
  }

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
      const { text, currentDir } = await this._editorTextService.getTextFromEditor();
      const processedText = await this._fileExpander.expandFileReferences(text, currentDir);
      await this._vscodeEnvironment.writeClipboard(processedText);
      LogWrapper.Instance().notify(
        '展開された参照を含むテキストがクリップボードにコピーされました v0.1.7'
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
