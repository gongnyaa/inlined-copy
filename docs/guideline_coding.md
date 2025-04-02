# コーディングガイドライン

## 命名規則
`@typescript-eslint/recommended`をベースとする。

### インターフェース
- 名称: `I` + クラス名
- デフォルト引数にはオプショナルパラメータをつける。

### クラス
- `PascalCase`
- 以下の特徴を持つクラスは、適切な接頭辞・接尾辞を使う
| 役割・特徴 | 接尾辞 | 例 |
|-----------|-------|----|
| 元のAPIを薄く覆って、そのままの機能を提供する | Wrapper | `VSCodeWrapper` |
| 元のAPIと内部で異なるインターフェースを適合させる | Adapter | `PaymentGatewayAdapter` |
| 複数機能をシンプルにまとめた統一インターフェースを提供する | Facade | `UserAuthFacade` |
| より高レベルで抽象化し、追加の機能やロジックを提供する | Service | `UserNotificationService` |


### 変数
- 変数は`camelCase`
- privateは _ が先頭

### 定数
- `UPPER_CASE`

### メソッド
- 通常のメソッドは`camelCase`
- 静的ファクトリメソッドは`PascalCase`

### コメント
- JSDocコメントは基本的に書かない。インターフェースから推測できない、利用者が知るべき情報があるときのみJSDocコメントを記載する。
- その他コメントは、コードを読めばわかる事は書かない。背景や意図等をコードを読んでも分からないときのみ記載する。

## 📌 クラス設計・依存性注入のコーディングルール

以下の基準で適切な依存性注入パターンを選択する。

| No. | 対象クラス | 状態 | 注入方法 | 実装例 |
| --- | -------- | ---- | -------- | ------ |
| ① | 共通サービス (Logger、API Wrapper 等) | なし | インターフェース＋シングルトン | `LoggerWrapper.Instance().log(message);` |
| ② | 状態を持つサービス (Repository、Service、Facade 等) | あり | コンストラクタ注入 | `constructor(private userRepo: IUserRepository) {}` |
| ③ | 状態を持たず頻繁に実装を切り替える単純な依存（バリデータ、フォーマッタ等） | なし | メソッド引数で注入 | `getUser(id: string, validator: IUserValidator): User` |

### ⚠️ 補足
- Loggerなどの共通サービスはグローバルにシングルトンで提供し、メソッド引数やコンストラクタでは注入しない。
- メソッド引数注入はテスト時など頻繁な実装切り替えを想定する場合に限定して利用する。

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