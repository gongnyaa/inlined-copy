import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogWrapper } from './LogWrapper';
import { VSCodeWrapper } from './VSCodeWrapper';
import { mockVSCodeWrapper } from './VSCodeWrapper.mock';

vi.mock('vscode', () => {
  return {
    window: {
      showInformationMessage: vi.fn(),
      createOutputChannel: vi.fn().mockReturnValue({
        appendLine: vi.fn(),
        show: vi.fn(),
      }),
    },
  };
});

describe('LogWrapper', () => {
  let target: LogWrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    VSCodeWrapper.SetInstance(mockVSCodeWrapper);
    target = new LogWrapper();
  });

  it('log_Happy', () => {
    target.log('テストメッセージ');

    expect(mockVSCodeWrapper.appendLine).toHaveBeenCalledWith(
      '[Inlined Copy] テストメッセージ',
      false
    );
  });

  it('error_Happy', () => {
    target.error('エラーメッセージ');

    expect(mockVSCodeWrapper.appendLine).toHaveBeenCalledWith(
      '[Inlined Copy] ERROR エラーメッセージ',
      true
    );
  });

  it('notify_Happy', async () => {
    const testMessage = 'テスト通知メッセージ';

    await target.notify(testMessage);

    expect(mockVSCodeWrapper.showInformationMessage).toHaveBeenCalledWith(
      '[Inlined Copy] テスト通知メッセージ'
    );
  });
});
