# コーディングガイドライン

## 命名規則
`@typescript-eslint/recommended`をベースとする。

### interface
- 名称: `I` + クラス名
- デフォルト引数にはオプショナルパラメータをつける。
- typeが不可避な場合以外、interfaceを利用する。

### クラス
#### 命名規則（役割別接尾辞）
- `PascalCase`
- 以下の特徴を持つクラスは、適切な接頭辞・接尾辞を使う
| 役割 | 接尾辞 |
|------|--------|
| APIの薄いラップ | `Wrapper` |
| 型変換などの適合 | `Adapter` |
| 複数機能の集約 | `Facade` |
| ビジネスロジック | `Service` |
- 上記クラスが存在する場合、他クラスでは、上記クラスを利用し直接の利用は避ける。

#### 依存注入ルール

| 種類 | インスタンス特性 | 注入方法 | 例 |
|------|----------------|-----------|-----|
| グローバル共通サービス | アプリケーション全体で単一インスタンス | シングルトン | `LoggerWrapper.Instance()` |
| コンテキスト依存サービス | コンテキストごとに異なるインスタンスが必要 | コンストラクタ注入 | `constructor(repo: IUserRepo)` |
| 操作固有の依存 | 操作ごとに切り替える可能性がある | メソッド引数注入 | `doX(validator: IValidator)` |

- 共通サービスは `.Instance()` でのみ使用し、引数やDI禁止
- テスト時は `SetInstance()` による差し替えのみ許可

#### importルール

- 不必要にインターフェースはimportしない
- モックファイル（`xxx.mock.ts`）ではインターフェースをimportして型定義に使用する

```ts
// ✅ OK
import { LogWrapper } from './logManager';
LogWrapper.Instance().log("msg");

// ❌ NG
import { ILogWrapper, LogWrapper } from './logManager';

// モックファイルでの例
import { ILogWrapper } from './logWrapper';
export const mockLogWrapper: ILogWrapper = { ... };

```

#### ファイル構成ルール

- ユーティリティや共通サービスは、以下のように用途ごとに分割する：

| ファイル名 | 用途 |
|------------|------|
| `xxx.ts` | 本体の実装 |
| `xxx.test.ts` | ユニットテスト |
| `xxx.mock.ts` | モック定義（テストや差し替え用） |

- 例：`logWrapper.ts`, `logWrapper.test.ts`, `logWrapper.mock.ts`


### 変数
- 変数は`camelCase`
- privateは _ が先頭

### 定数
- `UPPER_CASE`
- マジック文字列の回避する。
- 多言語化が必要なものは、メッセージ定数を使用する
  - メッセージの取得には`I18n.ts`の`t`関数を使用する
  - メッセージキーは`constants/Messages.ts`で定義する
- その他の定数は`constants`ディレクトリ内の適切なファイルに配置する

### メソッド
- 通常のメソッドは`camelCase`
- 静的ファクトリメソッドは`PascalCase`

### コメント
- JSDocコメントは基本的に書かない。インターフェースから推測できない、利用者が知るべき情報があるときのみJSDocコメントを記載する。
- その他コメントは、コードを読めばわかる事は書かない。背景や意図等をコードを読んでも分からないときのみ記載する。

以下が、冗長性を排除した**極めて簡潔なガイドライン**です：

## エラー処理
- 方針:
  - 正常系以外は例外をスローする
  - 呼び出し側では、処理を中断しない場合のみ例外をキャッチする
  - 例外クラスは適切に区別し、発生理由を明確にする
  - 最上位のエントリポイントで、例外をキャッチし、適切に処理する。
- 実装例:

```typescript
class FileNotFoundError extends Error {
  constructor(filePath: string) {
    super(`ファイルが見つかりません: ${filePath}`);
    this.name = 'FileNotFoundError';
  }
}

function readFile(path: string): string {
  // 正常系以外は例外をスロー
  if (!fileExists(path)) {
    throw new FileNotFoundError(path);
  }
  
  return readFileContent(path);
}

// 呼び出し側 
try {
  const content = readFile('/path/to/file.txt');
  processContent(content);
} catch (error) {
  if (error instanceof FileNotFoundError) {
    logger.warn(error.message);
    // 代替処理
  } else {
    // 予期せぬエラーは再スロー
    throw error;
  }
}

// 呼び出し側（処理を中断する場合）
// 例外キャッチを書かずに上位に伝播させる
const content = readFile('/path/to/file.txt');
processContent(content);

```