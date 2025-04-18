import { VSCodeWrapper, SingletonBase } from './';

export interface ILogWrapper {
  log(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  notify(message: string): Thenable<string | undefined>;
}

export class LogWrapper extends SingletonBase<ILogWrapper> implements ILogWrapper {
  public log(message: string): void {
    VSCodeWrapper.Instance().appendLine(`[Inlined Copy] ${message}`, false);
  }

  public warn(message: string): void {
    VSCodeWrapper.Instance().appendLine(`[Inlined Copy] WARN ${message}`, false);
  }

  public error(message: string): void {
    VSCodeWrapper.Instance().appendLine(`[Inlined Copy] ERROR ${message}`, true);
  }

  public notify(message: string): Thenable<string | undefined> {
    return VSCodeWrapper.Instance().showInformationMessage(`[Inlined Copy] ${message}`);
  }
}
