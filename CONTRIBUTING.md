# inlined-copy 開発ガイド（簡略版）

## 技術スタック
- Node.js (v18以上)
- vscode: ^1.94.0 (重要)
- pnpm: 依存関係管理
- TypeScript: 実装言語
- ESLint + Prettier: コード品質管理
- Vitest: テスト
- VS Code Extension API

## コード規約
- 命名規則: 変数は`camelCase`、定数は`UPPER_CASE`、クラスは`PascalCase`
- 未使用変数: `_prefixed`で表記（`_unusedVar`）
- ESLint設定: `@typescript-eslint/recommended`ベース
- 自動フォーマット: Prettier使用、手動フォーマット禁止
- プリコミットフック: lint-staged, 型チェック, テスト自動実行

## コメントガイドライン

このプロジェクトでは、コードの可読性と保守性を高めるため、以下のコメントガイドラインに従ってください：

### 必須コメント（日本語で記載）

以下のコメントは必須であり、日本語で記載してください：

1. **公開APIのJSDocコメント**
   - クラス、メソッド、関数の説明
   - パラメータ（@param）と戻り値（@returns）の説明
   - 例外（@throws）の説明（必要な場合）

2. **複雑なロジックの説明**
   - アルゴリズムの概要
   - 非直感的なコードの理由

### 不要なコメント（避けるべきもの）

以下のコメントは避けてください：

1. **実装の詳細を説明するコメント**
   - 例：`// 配列をループ処理`、`// キャッシュを更新`など、コードを見れば明らかな説明
   
2. **変数やメソッド名で明確になっているもの**
   - 例：`const count = 0; // カウンタを初期化`

3. **古いコードや変更履歴**
   - 例：`// 2023-05-01に変更`

4. **コメントアウトされたコード**
   - 使用しないコードはコメントアウトせず、削除してください

## セットアップと実行
```
pnpm install
pnpm run compile
code --extensionDevelopmentPath=${PWD}
```
デバッグ起動: F5キー

## ロギング
- `LogManager`: 2つのメソッド（log, error）
- コンソールに出力

```typescript
import { LogManager } from './utils/logManager';

// 通常のログメッセージを出力
LogManager.log('Your message here');

// エラーメッセージを出力
LogManager.error('Your error message here');
```

## テスト
- 場所: `src/test/vitest/`
- 実行: `pnpm test`（全テスト）, `pnpm run test:coverage`（カバレッジ）
- モック: 共通実装は`mocks/`ディレクトリ
- エッジケース: 特殊文字パス、パフォーマンス、循環参照など

## 主要コマンド
- `pnpm run lint`: ESLintチェック
- `pnpm run lint:fix`: ESLint自動修正
- `pnpm run prettier:fix`: 自動フォーマット
- `pnpm run typecheck`: 型チェック
- `vsce package`: VSIXパッケージ作成

## エラー処理
- カスタムエラークラス使用
- 主要エラー: `LargeDataException`, `CircularReferenceException`など
- `FileResult`型で結果伝達

## コミットメッセージの形式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type（必須）

コミットの種類を示します：

- **feat**: 新機能
- **fix**: バグ修正
- **docs**: ドキュメントのみの変更
- **style**: コードの動作に影響しない変更（フォーマット等）
- **refactor**: バグ修正や機能追加ではないコードの変更
- **perf**: パフォーマンス改善のためのコード変更
- **test**: テストの追加や修正
- **build**: ビルドシステムや外部依存関係の変更
- **ci**: CI設定ファイルやスクリプトの変更
- **chore**: その他の雑多な変更

### Scope（任意）

変更範囲を示します（例: auth, dashboard, api）

### Subject（必須）

簡潔な変更内容の説明。命令形の現在形を使用します。

## リリースノートへの反映

この規約に従ったコミットメッセージは、リリース時に自動的に適切なカテゴリに分類されます。

## CI制御

docだけの修正の場合、[skip ci] をコミットメッセージに含め、CIをスキップすること。

## コミット前の確認

[skip ci] をしない場合は、コミット前に以下を必ず実施し確認すること。
- pnpm format
- pnpm lint
- pnpm test
- pnpm build

## 開発用ドキュメント
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)


## ライセンス
MIT
