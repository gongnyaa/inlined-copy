import { VSCodeWrapper } from './VSCodeWrapper';

export interface ILogWrapper {
  log(message: string): void;
  error(message: string): void;
  notify(message: string): Thenable<string | undefined>;
}

export class LogWrapper implements ILogWrapper {
  private static _instance: LogWrapper;

  public static Instance(): LogWrapper {
    if (!this._instance) {
      this._instance = new LogWrapper();
    }
    return this._instance as LogWrapper;
  }

  public static SetInstance(instance: LogWrapper): void {
    this._instance = instance;
  }

  public log(message: string): void {
    VSCodeWrapper.Instance().appendLine(`[Inlined Copy] ${message}`, false);
  }

  public error(message: string): void {
    VSCodeWrapper.Instance().appendLine(`[Inlined Copy] ERROR ${message}`, true);
  }

  public notify(message: string): Thenable<string | undefined> {
    return VSCodeWrapper.Instance().showInformationMessage(`[Inlined Copy] ${message}`);
  }
}
