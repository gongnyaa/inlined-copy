# モックファイル作成プロンプト（mock.ts）

以下の「対象クラス」に対して、ユニットテストや依存性注入で使用できる**モッククラスまたはオブジェクト**を `xxx.mock.ts` ファイルとして作成してください。

## 対象クラス
![[logWrapper.ts]]

## 目的
- `SetInstance()` による差し替えで使用するモック実装を定義
- `vitest` テストや DI 用途で、型安全かつ柔軟に使用可能な構成とする

## 制約
- インターフェースに準拠する
- `vi.fn()` による関数のモック化を基本とする
- `mock<クラス名>` という名前の定数で export する
- 各関数は `jest/vitest` のスパイ（`vi.fn()`）を使って記録可能にする

## 例（LogWrapper 用）

```ts
// logWrapper.mock.ts
import { ILogWrapper } from './logWrapper';
import { vi } from 'vitest';

export const mockLogWrapper: ILogWrapper = {
  log: vi.fn(),
  error: vi.fn(),
  notify: vi.fn().mockResolvedValue('OK'),
};
```

## 生成対象ファイル（期待される出力）

- ファイル名: `xxx.mock.ts`
- 内容: モックオブジェクト（関数はすべて `vi.fn()`）、型は対象のインターフェース

## 備考
- 他のテストコードから import して使い回せるよう、個別ファイルに分ける
- 状態や副作用を持たない構成とする