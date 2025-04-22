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

### コード記述スタイル
- オブジェクトからのプロパティ取得には積極的にデストラクチャリングを活用する
  ```typescript
  // ✅ 推奨
  const { text, currentDir } = VSCodeWrapper.Instance().getSelectionText();
  if (text) {
    return { text, currentDir };
  }
  
  // ❌ 非推奨
  const selectionResult = VSCodeWrapper.Instance().getSelectionText();
  if (selectionResult.text) {
    return { text: selectionResult.text, currentDir: selectionResult.currentDir };
  }
  ```

## 責務の分離と抽象化

### 責務の明確な分離
- 各クラスは単一の責務を持つべき
- ユーティリティ機能は適切なWrapperクラスに分離する
- 以下の責務は明確に分離する：
  - パス操作 → PathWrapper
  - ファイルシステム操作 → FileSystemWrapper
  - VSCode API操作 → VSCodeWrapper
  - ログ出力 → LogWrapper

### 抽象化レベル
- 各クラス内のメソッドは同じ抽象化レベルを保つ
- 低レベルの操作は適切なWrapperクラスに委譲する
- 複数の低レベル操作を組み合わせた処理は、専用のメソッドとして抽出する

### 高レベルAPI設計
- 複雑な処理は高レベルAPIとして抽象化し、実装詳細を隠蔽する
- 例：
  ```typescript
  // ❌ 非推奨: 複数のステップを呼び出し元で管理
  const pathInfo = PathWrapper.Instance().createPathInfo(filePath);
  const searchPattern = PathWrapper.Instance().createSearchPattern(relativeBase, filePath);
  const files = await VSCodeWrapper.Instance().findFiles(searchPattern, excludePattern);
  const result = PathWrapper.Instance().filterMatchingFile(files.map(f => f.fsPath), pathInfo);
  
  // ✅ 推奨: 高レベルAPIとして提供
  const result = await PathWrapper.Instance().findFileInWorkspace(
    workspaceRoot, basePath, filePath, excludePattern, maxResults
  );
  ```

### メソッドの最適サイズ
- メソッドは20行以内を目標とする
- 20行を超える場合は、責務の分割を検討する
- 複雑なロジックは適切な名前の小さなメソッドに分割する

## ユーティリティクラスの設計

### 汎用ユーティリティの設計原則
- 特定のドメインに依存しない純粋な機能を提供する
- 副作用を最小限に抹える
- 入力と出力の関係が明確である
- テスト容易性を確保する
- 例：PathWrapper, StringUtilsなど

### ユーティリティの拡張方法
- 新しい機能が必要な場合は、既存のユーティリティクラスを拡張する
- 関連する機能をグループ化し、適切なクラスに配置する
- 複数のクラスにまたがる機能は、新しいユーティリティクラスの作成を検討する

### ユーティリティクラスの利用
- 既存のユーティリティクラスがある場合は、それを利用し、重複を避ける
- 例えば、パス操作は直接pathモジュールを使用せず、PathWrapperを使用する
- テスト時には、ユーティリティクラスをモック化して依存関係を切り離す

## 互換性と依存関係

### VSCodeバージョンの互換性
- VSCode拡張機能の互換性を確保するため、package.jsonの設定を適切に管理する
- `engines.vscode`と`devDependencies`の`@types/vscode`は同じバージョンを指定する
- Windsurfとの互換性を確保するため、バージョンは`^1.94.0`に設定する
  ```json
  {
    "engines": {
      "vscode": "^1.94.0"
    },
    "devDependencies": {
      "@types/vscode": "^1.94.0"
    }
  }
  ```

### 外部依存関係の管理
- 外部ライブラリへの依存は、適切なWrapperクラスを介してアクセスする
- 直接的な依存関係は、モジュールのルートレベルに限定する
- バージョンアップ時の影響範囲を最小限にするため、外部依存関係は集約する

