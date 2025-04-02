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
![[guideline_coding]]

## セットアップと実行
```
pnpm install
pnpm run compile
code --extensionDevelopmentPath=${PWD}
```
デバッグ起動: F5キー

## ロギング
- `LogManager`: 4レベル（debug, info, warn, error）
- 設定: VS Code設定で`logLevel`と`debugMode`調整可能

## テスト
- 場所: `src/test/vitest/`
- 実行: `pnpm test`（全テスト）
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


## 開発指針
pnpm test:coverageで、テスト率を100％に
すべてのドキュメントは必要最小限に



## ライセンス
MIT