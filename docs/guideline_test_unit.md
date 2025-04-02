# TypeScript ユニットテストガイドライン（簡潔版）

## 基本ルール

- `vitest` を使用
- `vi.clearAllMocks()` を `beforeEach` に記述
- テストケース名は日本語で具体的に
- 独自クラスへの依存はxxx.mock.tsでモック。その他クラスは、vi.mockでモック
- `vi.mock`の使用方法：
  1. ファイル先頭に記述
  2. 外部変数に依存させない（ホイスティングの問題を防ぐため）
  3. 基本的なモック定義のみを含める
  4. 複雑なモックや外部依存が必要な場合は：
     - `beforeEach`内でモックの振る舞いを設定
     - `vi.mocked()`を使用して型安全に設定

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

## VSCode API のモック化

### 基本的なアプローチ

```ts
// 1. モックの定義
vi.mock('vscode', async () => ({
  window: {
    createOutputChannel: vi.fn(),
    showInformationMessage: vi.fn()
  }
}));

// 2. テストファイル内での使用
describe('テスト対象', () => {
  let vscode: any;
  let mockOutputChannel: any;
  
  beforeEach(async () => {
    // モジュールの再インポートとモックの設定
    vscode = await import('vscode');
    mockOutputChannel = {
      appendLine: vi.fn(),
      show: vi.fn()
    };
    vi.mocked(vscode.window.createOutputChannel).mockReturnValue(mockOutputChannel);
  });
});
```

### 注意点

1. **ホイスティングの考慮**
   - `vi.mock`はファイルの最上部にホイスティングされる
   - モック定義内で外部変数を参照しない
   - 複雑なモックは`beforeEach`内で設定

2. **モックの再利用**
   - 共通のモックは別ファイル（`xxx.mock.ts`）に分離
   - テストファイル固有のモックは直接定義

3. **型安全性**
   - モックオブジェクトの型は`any`を許容
   - VSCode APIの型定義は参照のみ使用

## 例外処理テスト

```ts
expect(() => someFunc()).toThrow(MyError);
```

## テストカバレッジ

- 基本: 80%以上
- 共通サービス（Wrapper等）: 100%
- 複雑な条件分岐は全パターンをテスト