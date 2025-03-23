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


## 開発用ドキュメント
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)


## ライセンス
MIT
