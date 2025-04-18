import { VSCodeWrapper } from './VSCodeWrapper';
import { SingletonBase } from './SingletonBase';

export interface ILogWrapper {
  log(message: string): void;
  error(message: string): void;
  notify(message: string): Thenable<string | undefined>;
}

export class LogWrapper extends SingletonBase<ILogWrapper> implements ILogWrapper {
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
