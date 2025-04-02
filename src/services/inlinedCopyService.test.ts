import { describe, test, expect, vi } from 'vitest';
import { IInlinedCopyService, InlinedCopyService } from './inlinedCopyService';

describe('InlinedCopyService', () => {
  test('シングルトンパターンが正しく動作する', () => {
    // シングルトンインスタンスの取得
    const instance1 = InlinedCopyService.Instance();
    const instance2 = InlinedCopyService.Instance();

    // 同じインスタンスが返されることを確認
    expect(instance1).toBe(instance2);
  });

  test('SetInstanceメソッドでインスタンスを差し替えられる', () => {
    // モックインスタンスの作成
    const mockService: IInlinedCopyService = {
      executeCommand: vi.fn().mockResolvedValue(undefined),
    };

    // モックインスタンスを設定
    InlinedCopyService.SetInstance(mockService);

    // モックインスタンスが返されることを確認
    expect(InlinedCopyService.Instance()).toBe(mockService);
  });
});
