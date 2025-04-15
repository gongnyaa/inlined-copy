import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogWrapper } from './LogWrapper';
import { VSCodeWrapper } from './VSCodeWrapper';
import { mockVSCodeWrapper } from './VSCodeWrapper.mock';

describe('LogWrapper', () => {
  let logWrapper: LogWrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    VSCodeWrapper.SetInstance(mockVSCodeWrapper as VSCodeWrapper);
    logWrapper = new LogWrapper();
  });

  it('error', () => {
    logWrapper.error('エラーメッセージ');

    expect(mockVSCodeWrapper.appendLine).toHaveBeenCalledWith(
      '[Inlined Copy] ERROR エラーメッセージ',
      true
    );
  });

  it('ログメッセージを出力すること', () => {
    logWrapper.log('テストメッセージ');

    expect(mockVSCodeWrapper.appendLine).toHaveBeenCalledWith(
      '[Inlined Copy] テストメッセージ',
      false
    );
  });

  it('トースト通知を表示すること', async () => {
    const testMessage = 'テスト通知メッセージ';

    logWrapper.notify(testMessage);

    // 通知メソッドが呼ばれたことを確認
    expect(mockVSCodeWrapper.showInformationMessage).toHaveBeenCalledWith(
      '[Inlined Copy] テスト通知メッセージ'
    );
  });
});
