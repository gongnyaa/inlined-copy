// inlinedCopyService.ts

import { FileExpander, IFileExpander } from '../fileExpander';
import { IVSCodeEnvironment, VSCodeEnvironment } from '../utils/vscodeEnvironment';
import { ILogManager, LogManager } from '../utils/logManager';
import { EditorTextService, IEditorTextService } from './editorTextService';
import { TextNotFoundException } from '../errors/errorTypes';

export interface IInlinedCopyService {
  executeCommand(): Promise<void>;
}

export class InlinedCopyService implements IInlinedCopyService {
  private static _instance: IInlinedCopyService;
  private _editorTextService: IEditorTextService;
  private _fileExpander: IFileExpander;
  private _vscodeEnvironment: IVSCodeEnvironment;
  private _logManager: ILogManager;

  constructor(
    editorTextService: IEditorTextService = new EditorTextService(),
    fileExpander: IFileExpander = new FileExpander(),
    vscodeEnvironment: IVSCodeEnvironment = VSCodeEnvironment.Instance(),
    logManager: ILogManager = LogManager.Instance()
  ) {
    this._editorTextService = editorTextService;
    this._fileExpander = fileExpander;
    this._vscodeEnvironment = vscodeEnvironment;
    this._logManager = logManager;
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
      this._logManager.notify(
        '展開された参照を含むテキストがクリップボードにコピーされました v0.1.7'
      );
    } catch (error) {
      if (error instanceof TextNotFoundException) {
        this._logManager.notify('コピー元のテキストが見つかりませんでした');
        return;
      }
      this._logManager.error(
        `予期せぬエラー: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
