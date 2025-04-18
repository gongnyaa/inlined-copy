import { VSCodeWrapper, SingletonBase } from './';
import { MESSAGE_KEYS } from '../constants/Messages';
import { t } from './I18n';

export interface ILogWrapper {
  log(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  notify(message: string): Thenable<string | undefined>;
}

export class LogWrapper extends SingletonBase<ILogWrapper> implements ILogWrapper {
  public log(message: string): void {
    VSCodeWrapper.Instance().appendLine(`${t(MESSAGE_KEYS.LOG_PREFIX)} ${message}`, false);
  }

  public warn(message: string): void {
    VSCodeWrapper.Instance().appendLine(
      `${t(MESSAGE_KEYS.LOG_PREFIX)} ${t(MESSAGE_KEYS.LOG_WARN_PREFIX)} ${message}`,
      false
    );
  }

  public error(message: string): void {
    VSCodeWrapper.Instance().appendLine(
      `${t(MESSAGE_KEYS.LOG_PREFIX)} ${t(MESSAGE_KEYS.LOG_ERROR_PREFIX)} ${message}`,
      true
    );
  }

  public notify(message: string): Thenable<string | undefined> {
    return VSCodeWrapper.Instance().showInformationMessage(
      `${t(MESSAGE_KEYS.LOG_PREFIX)} ${message}`
    );
  }
}
