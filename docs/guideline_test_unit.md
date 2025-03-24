```markdown
# VSCode拡張機能のテストコード作成ガイドライン

VSCode拡張機能でテストを行う際の、実践的かつシンプルなガイドラインです。  
一般的なテスト原則の説明は省略し、VSCode特有の問題を中心にまとめています。  

---

## 1. 基本的なテスト例

VSCode APIをモックしつつ、クラスやモジュールをテストする最小限のコード例です。  
テストファイルの冒頭で`vi.mock`を呼び出すこと、`beforeEach`でモック状態をリセットすることがポイントです。

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { 対象クラス } from './対象ファイル';

// VSCode APIのモック設定
vi.mock('vscode', () => ({
  window: {
    createOutputChannel: vi.fn().mockReturnValue({
      appendLine: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn()
    })
  }
}));

describe('対象クラスのテスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('メソッド呼び出し時にOutputChannelへログが出力されること', () => {
    対象クラス.メソッド();
    expect(vscode.window.createOutputChannel).toHaveBeenCalled();
    expect(vscode.window.createOutputChannel().appendLine).toHaveBeenCalledWith('期待するメッセージ');
  });
});
```

---

## 2. テストを書く上でのポイント

- **`vi.mock`の宣言はファイルの先頭へ**  
  テスト開始前にモジュールがモック化されるようにするため。  

- **モック対象は直接参照**  
  例: `expect(vscode.window.createOutputChannel).toHaveBeenCalled()` など。  

- **プライベートプロパティへのアクセス**  
  TypeScriptの型制限を回避するため、`(クラス as any).privateProp` の形式を使用。  

- **テストケース名は日本語で具体的に**  
  実際のユースケースをわかりやすく表現。  

- **モックのプロパティアクセス**  
  呼び出し履歴などを確認する場合は型アサーションを使用。  
  ```typescript
  const handler = (vscode.commands.registerCommand as any).mock.calls[0][1];
  ```  

---

## 3. VSCode APIモックの例

### 3-1. コマンド登録

```typescript
vi.mock('vscode', () => ({
  commands: {
    registerCommand: vi.fn(),
    executeCommand: vi.fn()
  }
}));
```

### 3-2. ファイルシステムアクセス

```typescript
vi.mock('vscode', () => ({
  workspace: {
    fs: {
      readFile: vi.fn().mockResolvedValue(Buffer.from('ファイル内容')),
      writeFile: vi.fn().mockResolvedValue(undefined)
    }
  }
}));
```

### 3-3. イベント処理

```typescript
vi.mock('vscode', () => ({
  EventEmitter: vi.fn().mockImplementation(() => ({
    event: vi.fn().mockImplementation(callback => {
      callback();
      return { dispose: vi.fn() };
    }),
    fire: vi.fn()
  }))
}));
```

### 3-4. ExtensionContextのモック

```typescript
const mockContext = {
  subscriptions: [],
  asAbsolutePath: vi.fn()
} as unknown as vscode.ExtensionContext;
```

---

## 4. モック化が難しいケースの対応

- **静的メソッドのモック**  
  一時的にクラスのメソッドを差し替える。  
  ```typescript
  const original = MyClass.staticMethod;
  MyClass.staticMethod = vi.fn().mockReturnValue('結果');
  // ...テスト
  MyClass.staticMethod = original; // テスト後に元に戻す
  ```
  
- **複雑なオブジェクト構造**  
  URIや設定など、ネストされたプロパティをすべてモックする。  
  ```typescript
  vi.mock('vscode', () => ({
    Uri: { file: vi.fn(path => ({ fsPath: path })) }
  }));
  ```

- **バインドされたメソッド**  
  `this`を含むメソッドの場合、テスト時に明示的にバインドやラップをしてモック化。  

---

## 5. 依存性注入（DI）のパターン

コードをテストしやすくするため、拡張機能が利用するサービスやクラスを外部から注入する方法を示します。

### 5-1. デフォルト引数を使う

```typescript
export function activate(
  context: vscode.ExtensionContext,
  logManager = LogManager,
  serviceFactory = () => new MyService()
) {
  logManager.initialize(context);
  const service = serviceFactory();
}
```

**テスト例:**
```typescript
it('依存サービスを正しく利用する', () => {
  const mockLogManager = { initialize: vi.fn() };
  const mockService = { doSomething: vi.fn() };

  activate(mockContext, mockLogManager, () => mockService);
  expect(mockLogManager.initialize).toHaveBeenCalledWith(mockContext);
});
```

### 5-2. モジュールレベルでエクスポート

```typescript
export const service = new MyService();

export function activate(context: vscode.ExtensionContext) {
  service.execute();
}
```

**テスト例:**
```typescript
vi.mock('./services', () => ({
  service: { execute: vi.fn() }
}));

it('モジュールレベルのサービスを使用する', () => {
  activate(mockContext);
  expect(service.execute).toHaveBeenCalled();
});
```

### 5-3. ファクトリー関数で生成

```typescript
export const createService = () => new MyService();

export function activate(context: vscode.ExtensionContext) {
  const service = createService();
  service.execute();
}
```

**テスト例:**
```typescript
import * as module from './module';

it('ファクトリー関数を使用する', () => {
  const mockService = { execute: vi.fn() };
  vi.spyOn(module, 'createService').mockReturnValue(mockService);

  activate(mockContext);
  expect(mockService.execute).toHaveBeenCalled();
});
```

---

これらのポイントやコード例を参考に、VSCode拡張機能開発特有のテストを効率よく実装してください。  
適切なモックとDIパターンを活用することで、堅牢なテストを書けるようになります。
```