import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogWrapper, VSCodeWrapper, t } from './';
import { mockVSCodeWrapper } from './VSCodeWrapper.mock';
import { MESSAGE_KEYS } from '../constants/Messages';

describe('LogWrapper', () => {
  let target: LogWrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    VSCodeWrapper.SetInstance(mockVSCodeWrapper);
    target = new LogWrapper();
  });

  it('log_Happy', () => {
    const testMessage = 'テストメッセージ';
    target.log(testMessage);

    expect(mockVSCodeWrapper.appendLine).toHaveBeenCalledWith(
      `${t(MESSAGE_KEYS.LOG_PREFIX)} ${testMessage}`,
      false
    );
  });

  it('error_Happy', () => {
    const testMessage = 'エラーメッセージ';
    target.error(testMessage);

    expect(mockVSCodeWrapper.appendLine).toHaveBeenCalledWith(
      `${t(MESSAGE_KEYS.LOG_PREFIX)} ${t(MESSAGE_KEYS.LOG_ERROR_PREFIX)} ${testMessage}`,
      true
    );
  });

  it('notify_Happy', async () => {
    const testMessage = 'テスト通知メッセージ';

    await target.notify(testMessage);

    expect(mockVSCodeWrapper.showInformationMessage).toHaveBeenCalledWith(
      `${t(MESSAGE_KEYS.LOG_PREFIX)} ${testMessage}`
    );
  });

  it('warn_Happy', async () => {
    const testMessage = 'テスト警告メッセージ';

    await target.warn(testMessage);

    expect(mockVSCodeWrapper.appendLine).toHaveBeenCalledWith(
      `${t(MESSAGE_KEYS.LOG_PREFIX)} ${t(MESSAGE_KEYS.LOG_WARN_PREFIX)} ${testMessage}`,
      false
    );
  });
});
