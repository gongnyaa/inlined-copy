# コーディングガイドライン

## 命名規則
`@typescript-eslint/recommended`をベースとする。

### インターフェース
- 名称: `I` + クラス名
- デフォルト引数にはオプショナルパラメータをつける。

### クラス
- `PascalCase`

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
- その他コメントは、コードを読めばわかる事は書かない。

## クラス設計

### 複数のクラスから利用される共通サービス
- 方針: インターフェース＋シングルトンパターンを使用
- 目的: テスト容易性、実装切り替え可能に、簡潔性
- 実装例:

```typescript
interface IMyLogger {
  log(message: string): void;
}

class MyLogger implements IMyLogger {
  private static _instance: IMyLogger;
  
  public static Instance(): IMyLogger {
    if (!this._instance) {
      this._instance = new MyLogger();
    }
    return this._instance;
  }
  
  // テスト用に実装を差し替えるメソッド
  public static SetInstance(logger: IMyLogger): void {
    this._instance = logger;
  }
  
  log(message: string): void {
    console.log(message);
  }
}

// 通常使用時
MyLogger.Instance().log("hogehoge");

// テスト時
const mockLogger = { log: (message: string) => { /* mock implementation */ } };
MyLogger.SetInstance(mockLogger);
```

### 依存性注入方法
- なるべく引数で注入する。
- 状態を持つ依存先の場合、必要に応じてコンストラクタで注入する。
- 多くのクラスから利用される共通クラスの場合は、シングルトンで注入する。

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