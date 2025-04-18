# TypeScript ユニットテストガイドライン

## 基本ルール

- `vitest` を使用
- `vi.clearAllMocks()` を `beforeEach` に記述
- テストケース名は `メソッド名_シナリオタイプ` の形式を基本とする
- シナリオタイプの例：
  - `HappyPath`: 正常系処理のテスト
  - `Error`: 異常系・例外処理のテスト
- 例：
  ```typescript
  it('getTextFromEditor_HappyPath_ReturnsSelectedText', async () => {});
  it('getTextFromEditor_Error_ThrowsTextNotFoundError', async () => {});
  ```
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

### classでない場合の依存性注入

- 関数やオブジェクトを直接exportしている場合は、差し替え用のsetter関数（例：`setT(fn)`）を用意し、テスト時にモック実装へ差し替える
- 実装例：

```ts
// 本体
let tImpl = (...args) => { /* 通常処理 */ };
export function setT(fn) { tImpl = fn; }
export function t(...args) { return tImpl(...args); }

// テスト
import { t, setT } from './I18n';
import { mockT } from './I18n.mock';
setT(mockT);
```
- この方法により、class以外でも依存性の注入・モック化が容易に行える

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

### 例外テストの標準パターン
例外テストには以下のパターンを使用する：


```typescript
try {
  await target.someMethod();
  fail(TEST_ERRORS.NO_EXCEPTION); // 例外が発生しなかった場合は失敗
} catch (error) {
  if (error instanceof ExpectedError) {
    expect(error.message).toEqual('Expected message');
  } else {
    fail(TEST_ERRORS.WRONG_EXCEPTION_TYPE);
  }
}
```

#### 共通エラーメッセージの定義
テスト失敗メッセージは定数として定義し、再利用する：
```typescript
// constants/TestMessages.ts
export const TEST_ERRORS = {
  NO_EXCEPTION: '例外が発生しませんでした',
  WRONG_EXCEPTION_TYPE: '期待とは異なる例外型が発生しました'
} as const;
```

## テストカバレッジ

- 基本: 100%
- 共通サービス（Wrapper等）: 100%
- 複雑な条件分岐は全パターンをテスト

### 関数型インジェクション
- クラスでない機能（関数）のモック化対応として、実装と呼び出しを分離する
- 実装側：
  ```typescript
  // 実装関数を変数に格納
  let implFunction = (params) => { /* 実装 */ };
  
  // 実装関数を差し替えるための関数
  export function setImplFunction(fn) {
    implFunction = fn;
  }
  
  // 外部に公開する関数（実装関数をラップ）
  export function publicFunction(params) {
    return implFunction(params);
  }
  ```
- テスト側：
  ```typescript
  // テスト時に差し替え
  import { setImplFunction } from './module';
  setImplFunction(mockFunction);
  ```


