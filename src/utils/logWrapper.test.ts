import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogWrapper } from './logWrapper';
import { mockLogWrapper } from './logWrapper.mock';

describe('LogWrapper 機能テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    LogWrapper.SetInstance(mockLogWrapper as LogWrapper);
  });

  it('エラーメッセージを出力すること', () => {
    LogWrapper.Instance().error('エラーメッセージ');

    expect(mockLogWrapper.error).toHaveBeenCalledWith('エラーメッセージ');
  });

  it('ログメッセージを出力すること', () => {
    LogWrapper.Instance().log('テストメッセージ');

    expect(mockLogWrapper.log).toHaveBeenCalledWith('テストメッセージ');
  });

  it('トースト通知を表示すること', async () => {
    const testMessage = 'テスト通知メッセージ';

    const result = await LogWrapper.Instance().notify(testMessage);

    // 通知メソッドが呼ばれたことを確認
    expect(mockLogWrapper.notify).toHaveBeenCalledWith(testMessage);
    // 戻り値が期待通りであることを確認
    expect(result).toBe('OK');
  });
});
