# TypeScript ユニットテストガイドライン（簡潔版）

## 基本ルール

- `vitest` を使用
- `vi.mock` はファイル先頭に記述
- `vi.clearAllMocks()` を `beforeEach` に記述
- テストケース名は日本語で具体的に
- 独自クラスへの依存はxxx.mock.tsでモック。その他クラスは、vi.mockでモック

---

## テスト構成
対象ファイルと同ディレクトリに配置
| ファイル名 | 用途 |
|------------|------|
| `xxx.test.ts` | テスト本体 |
| `xxx.mock.ts` | モック定義（`vi.fn()` 使用） |

---

## モックの書き方

- インターフェース準拠
- `vi.fn()` で関数モック化
- `xxx.mock.ts` 内で `mockXxx` 名で export

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

## シングルトンのテスト

```ts
beforeEach(() => {
  vi.clearAllMocks();
  // テスト前にインスタンスをリセット
  LogWrapper.SetInstance(mockLogWrapper as LogWrapper);
});
```

## 非同期テスト

```ts
it('非同期処理が正しく完了すること', async () => {
  await expect(asyncFunction()).resolves.toBe(expectedValue);
});
```

## テスト対象の初期化

```ts
let target: TargetClass;

beforeEach(() => {
  vi.clearAllMocks();
  // 依存のモックを設定
  DependencyClass.SetInstance(mockDependency);
  // テスト対象の初期化
  target = TargetClass.Instance();
});
```

## VSCode API のモック例

```ts
vi.mock('vscode', () => ({
  window: {
    createOutputChannel: vi.fn().mockReturnValue({
      appendLine: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn()
    }),
    showInformationMessage: vi.fn()
  }
}));
```

## 例外処理テスト

```ts
expect(() => someFunc()).toThrow(MyError);
```

## テストカバレッジ

- 基本: 80%以上
- 共通サービス（Wrapper等）: 100%
- 複雑な条件分岐は全パターンをテスト