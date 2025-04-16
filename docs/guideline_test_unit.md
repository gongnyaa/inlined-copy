# TypeScript ユニットテストガイドライン

## 基本ルール

- `vitest` を使用
- `vi.clearAllMocks()` を `beforeEach` に記述
- テストケース名はメソッド名_Happyまたはメソッド名_Errorの形式
  - 条件によって結果が分岐するときは、_条件名を英語で追加する。
- 独自クラスへの依存はxxx.mock.tsでモック。その他クラスは、vi.mockでモック
- `vi.mock`の使用方法：
  1. 対象クラスが、vscode等外部クラスに直接依存している時にのみ使う。自クラスでラップしている場合は、`vi.mock`を避け、`xxx.mock.ts`でimportする事。
  2. 利用する場合は、テストファイル先頭に記述
  3. 外部変数に依存させない（ホイスティングの問題を防ぐため）
  4. 基本的なモック定義のみを含める
  5. 複雑なモックや外部依存が必要な場合は：
     - `beforeEach`内でモックの振る舞いを設定
     - `vi.mocked()`を使用して型安全に設定

---

## ファイル構成
対象ファイルと同ディレクトリに配置
| ファイル名 | 用途 |
|------------|------|
| `xxx.test.ts` | テスト本体 |
| `xxx.mock.ts` | モック定義（`vi.fn()` 使用） |

## テスト対象外
- SetInstance等のテスト用に作られたメソッド
- シングルトンでインスタンスを取得するための、Instance()・メソッド

---

## モックの書き方

- インターフェース準拠
- `vi.fn()` で関数モック化
- `xxx.mock.ts` 内で `mockXxx` 名で export
- テスト固有のモックオブジェクトは、各テストケース内で作成することも許容する
- 複数のテストで共通で使用するモックは`beforeEach`内で初期化することを推奨

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

## テスト対象の初期化

```ts
let target: TargetClass;

beforeEach(() => {
  vi.clearAllMocks();
  DependencyClass.SetInstance(mockDependency);
  target = new TargetClass();
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