import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogWrapper } from './logWrapper';
import { VSCodeWrapper } from './VSCodeWrapper';
import { mockVSCodeWrapper } from './VSCodeWrapper.mock';

describe('LogWrapper 機能テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // VSCodeWrapperのモックを設定
    VSCodeWrapper.SetInstance(mockVSCodeWrapper as VSCodeWrapper);
  });

  it('エラーメッセージを出力すること', () => {
    LogWrapper.Instance().error('エラーメッセージ');

    expect(mockVSCodeWrapper.appendLine).toHaveBeenCalledWith(
      '[Inlined Copy] ERROR エラーメッセージ',
      true
    );
  });

  it('ログメッセージを出力すること', () => {
    LogWrapper.Instance().log('テストメッセージ');

    expect(mockVSCodeWrapper.appendLine).toHaveBeenCalledWith(
      '[Inlined Copy] テストメッセージ',
      false
    );
  });

  it('トースト通知を表示すること', async () => {
    const testMessage = 'テスト通知メッセージ';

    await LogWrapper.Instance().notify(testMessage);

    // 通知メソッドが呼ばれたことを確認
    expect(mockVSCodeWrapper.showInformationMessage).toHaveBeenCalledWith(
      '[Inlined Copy] テスト通知メッセージ'
    );
  });
});
