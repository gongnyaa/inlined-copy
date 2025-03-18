# Devin向け指示文策定依頼

以下の3つの情報が後述されます：

- **タスク内容**
- **プロジェクト基本情報**
- **タスク固有の補足情報**

これらを踏まえて、**Devin(Claude sonnet 3.7)** に実行させたい業務の指示文（**「計画策定依頼」**） を.md形式で作成してください。

## 【依頼概要】

本依頼の目的は、Devinが **1指示文につき10ACU（約10時間）以内**で完了できる範囲を正しく認識し、 **「実行するための指示文（計画）」** を策定することです。

## 【指示書の要件】

### 1. ジュニアエンジニア(Devin)が理解可能な具体的な手順書

- コード修正箇所の例示 (ファイル名・関数名など) や、実装のヒントを含めてもOK。
- ただし不必要に冗長な説明は避け、**最小限かつ十分な情報**を盛り込む。
- 成果物・制約・完了の条件は明確に記載する。
- 「プロジェクト基本情報」に記載されているドキュメント目次から手順ごとに参照すべきドキュメントを明示する。
- 作業遂行後、ドキュメントを更新するタスクも明示する。

### 2. 10ACU(10時間)以内の1指示文で完了できるよう範囲を限定

- タスクが大きく、10ACUで終わらないと推測される場合は、指示文の分割を提案してください。

### 3. 成果物の定義と提出先の明示

- 例: 「ブランチ名には タスクを識別する英単語 を含め、完了後にGitHubへプルリクを作成」
- 作成すべき成果物を明記すること
- テスト実行や E2E チェックなど、完了判定ができる基準を明文化する。

### 4. プロジェクトのルール遵守

- 「プロジェクト基本情報」に記載された各種ドキュメントの規約を守る。
- 「タスク固有の補足情報」で指定された要件や状況、制約を必ず考慮する。

### 5. 依存関係や前提タスクの順序

- 手順のうち、並行実行が可能なものと、順次実行が必須なものを明記する。
- 事前に人間が行う前提タスクがあれば、明記する。（アカウントの作成等）

### 6. AIエージェントがつまずきそうな箇所への補足・対策

- 環境変数の設定、認証情報の管理、ライブラリのバージョン、既存コードの取り扱いなど。
- 効率的にタスクを実施するためのアドバイス
- 実装中に遭遇する可能性が高い問題と解決法
- 3度施行しても同じ問題が解決できない場合は、いったん作業を中断して問題を相談する

### 7. タスク実施後のフォローアップ

#### ドキュメントの更新

- 「プロジェクト基本情報」のドキュメント目次から適切に選別し、タスクに伴い、更新する必要があるものを明記する。

#### コミット

- コミットルールに基づき、型チェックやLint、unitテスト実施後コミット

#### PRに追記

- 作業の概要
- タスク毎に見積もりと実際ACCの比較表
- タスク毎に発生した想定外の問題と対策
- プロダクトや技術負債に関する改善点（あれば）
- 重大なリスクがある項目（セキュリティ・パフォーマンス・UX等）（あれば）

## 【出力例のイメージ】

````markdown
# [タスクID] XXX 機能の実装計画

## 1. タスク概要

- この機能はユーザの○○を保存し、Supabase上で管理する。

## 2. 前提情報

- 「プロジェクト基本情報」：コーディング規約は ESLint + Prettier
- 「タスク固有の補足情報」：RLS (Row Level Security) を有効にする必要あり

## 3. 実装手順

### 3.1. Supabase の items テーブルへ カラム xxx を追加 (1時間)

- 参照: `[[05_database]]` テーブルの定義
- SQL例:
  ```sql
  ALTER TABLE items ADD COLUMN xxx TEXT;
  ```
````

### 3.2. Next.js で /items/[id] ページの API を拡張 (2時間)

- 参照: `[[04_api]]` 現在のAPIの把握
- 実装内容:
  - GET, POST, PUT メソッドの追加
  - バリデーション処理の実装

### 3.3. フロントエンドフォームのUI修正 (1時間)

- 対象ファイル: `components/ItemForm.tsx`
- 参照:
  - `[[32_component_rule]]` コンポーネント作成ルール（要遵守）
  - `[[17_design]]` UI/UXデザイン（要遵守）

### 3.4. テスト実施 (2時間)

- 参照: `[[12_testing]]` テストの作成・実施
- 単体テスト: 新規APIエンドポイントのテスト追加
- E2Eテスト: フォーム送信からデータ保存までの一連の流れを確認

### 3.5. ドキュメント更新 (1時間)

- 手順:
  - `[[03_component_list]]` に作成したコンポーネントの情報を追加
  - `[[05_database]]` にデータベース定義の変更を反映
  - `[[04_api]]` に新規APIエンドポイントの仕様を追記

### 3.6. コミット・PRの作成 (1時間)

- 実施内容:
  - 型チェック・Lintの実行
  - ユニットテスト全体の実行確認
  - PR作成時に下記の追記事項を含める

## 4. 成果物・完了条件

- ブランチ名: `feature/items-crud-enhance`
- PR作成先: GitHub main ブランチ
- 完了条件:
  - LighthouseスコアがAA水準を満たすこと
  - コントラスト比要件を満たすこと
  - すべてのテストがパスすること

## 5. 注意事項

- RLSポリシー設定ファイル： `.supabase/config/rls.sql`
- masterブランチからブランチを作成して作業すること
- Supabaseの変更はマイグレーションファイルとして保存すること

## 6. 想定される問題と対策

- Supabaseのスキーマ変更後にローカル環境と同期できない場合:
  → `npx supabase db reset` を実行して再同期

- Next.js APIエンドポイントでのタイプエラー:
  → zod スキーマを使用して型安全性を確保

## 7. 要更新ドキュメント

- `[[03_component_list]]`: コンポーネントの把握・更新
- `[[04_api]]`: 現在のAPIの把握・新規API追加
- `[[05_database]]`: テーブルの定義更新

## 8. PR追記事項

- 作業概要: このPRではユーザー情報保存機能の実装を行いました
- 見積もり vs 実績:
  | ステップ | 見積もり(時間) | 実績(ACC) |
  |---------|--------------|-----------|
  | DB変更 | 1.0 | 0.8 |
  | API実装 | 2.0 | 2.5 |
  | UI修正 | 1.0 | 1.2 |
  | テスト | 2.0 | 1.5 |
  | 合計 | 8.0 | 7.0 |
- 想定外の問題: テーブル変更後のマイグレーションで型定義の更新が必要でした
- 技術負債: API入力バリデーションの共通化が今後必要です
- リスク: なし

```

## プロジェクト基本情報

```

# Inlined Copy

**Extension ID**: `frecre.inlined-copy`

## Overview

**Inlined Copy** is a VS Code extension that parses special notations in Markdown files, expands them by inlining content from referenced files or sections, and then copies the result to the clipboard. It is developed as an open-source project, aiming to streamline various documentation and content reuse workflows, such as:

- Generating document templates or snippets more efficiently  
- Referencing multiple files with `![[filename]]` notation for batch copying  
- Copying specific sections or substituting parameters using `{{parameter}}`  

## Roadmap

This project implements features in stages. The main milestones are:

### Ver 1 – `![[filename]]` Inline Copy
- Detects `![[filename]]` and copies the entire content of the referenced file
- Supports both relative and absolute file paths

### Ver 2 – `![[filename#heading]]` Inline Copy
- Extracts and copies the content under a specific heading in the referenced file
- Additional considerations: multi-level headings, multiple sections

### Ver 3 – Reference Tag Autocomplete
- Suggests file names when typing `![[`
- Suggests headings when typing `#` after a file name

### Ver 4 – `{{parameter}}` Input (Key-Value)
- Prompts the user to input values for `{{parameter}}`
- Replaces them upon copying

### Ver 5 – `{{parameter=defaultValue}}` Input
- Supports default values when prompting for parameters
- Uses the default if the user leaves the prompt blank

### Ver 6 – `{{parameter}}` Input (JSON)
- Allows multiple parameters to be replaced in one go using JSON
- Example: `{"name": "Devin", "project": "inlined Copy"}`

### Ver 7 – Markdown Preview Integration
- Real-time expansion of `![[...]]` and `{{...}}` in the VS Code Markdown preview
- Preview the final content before copying

## Installation

### Development Version
1. Clone the repository  
2. Run `pnpm install && pnpm run compile`  
3. Install the resulting VSIX package via VS Code’s **Extensions: Install from VSIX...**

### Marketplace Publication
Once published, you can install by searching for **Inlined Copy** (`frecre.inlined-copy`) in the VS Code Extensions marketplace.

## Usage

1. **Open the command palette**: `Ctrl + Shift + P` (Mac: `Cmd + Shift + P`)  
2. Select **Inlined Copy: Copy Inline**  
3. The extension analyzes the current editor content, expanding all `![[...]]` references and `{{...}}` parameters  
4. The resulting text is copied to your clipboard, ready to be pasted anywhere  

**Keyboard shortcut**: `Ctrl + Shift + C` (Mac: `Cmd + Shift + C`)

### Supported Notations

- `![[filename]]`  
  Expands to the entire content of the referenced file  
- `![[filename#heading]]`  
  Expands only the content under the specified heading in the referenced file  
- `{{parameter}}`  
  Prompts the user to input a value for the parameter  
- `{{parameter=defaultValue}}`  
  Prompts the user with a default value

## document Index

- `README.md` : Overview of the project
- `LICENSE.md` : License
- `eslint.config.js` : ESLint configuration
- `package.json` : Project configuration
- `tsconfig.json` : TypeScript configuration
- `.gitignore` : Git ignore
- `vitest.config.ts` : Test configuration
- `src` : Source code
- `src/test` : Test code
- `prompt` : Prompt template
- `tasks` : task list

## Contributing

- Contributions via **Fork & PR** are welcome.  
- Please open issues for bug reports or feature suggestions.  
- Refer to `CONTRIBUTING.md` (in progress) for details on code standards and linting.

## Development

### Technology Stack

1. **Node.js (v18+)**  
   Used for the VS Code extension runtime environment.
2. **pnpm**  
   Dependency manager. Main commands: `pnpm install`, `pnpm update`.
3. **TypeScript**  
   Primary language for extension development. Compile: `pnpm tsc -p ./`.
4. **ESLint + Prettier**  
   For code quality and style consistency. Commands: `pnpm run lint`, `pnpm run lint:fix`.
5. **Vitest**  
   Test framework. Commands: `pnpm test`, `pnpm run test:coverage`.
6. **VS Code Extension API**  
   Used to create the extension. Debug with the `F5` key.

### Setup

1. Install [pnpm](https://pnpm.io)  
2. Run `pnpm install`  
3. Press **F5** to launch VS Code debugging

### Local Test
```bash
pnpm install        # For initial setup
pnpm run compile
code --extensionDevelopmentPath=${PWD}

Then open the command palette (Ctrl+Shift+P), run Inlined Copy: Copy Inline, and verify functionality.

Building and Packaging

pnpm run compile
pnpm install -g @vscode/vsce
vsce package

Generates a .vsix file which can be installed in VS Code.

Known Limitations
	•	Circular references between files are not yet detected
	•	Very large files may cause performance issues
	•	Currently supports local files only

License

MIT License

MIT License

Copyright (c) 2025 gongnyaa

Permission is hereby granted, free of charge, to any person obtaining a copy
...

(The full MIT license text applies as above.)



```

## タスク固有の補足情報

```
タスクの実施状況は以下の通り
## 完了したタスク ✅

### タスク1: 基本構造の準備
- [x] yo codeによる拡張機能スキャフォールド作成
- [x] package.jsonの設定（コマンド登録、キーボードショートカット、アクティベーションイベント）
- [x] extension.tsの基本構造実装（アクティベーション処理、コマンド登録）
- [x] GitHubリポジトリ初期化 & README記載

### タスク2: コマンド「Copy Inline」の実装
- [x] エディタのアクティブテキストを取得し、正規表現で![[ファイル名]]パターンを検出
- [x] ファイルパス解決ロジック実装（絶対パス・相対パスの両方に対応）
- [x] 指定ファイルを読み込んでテキストにインライン展開（複数パターン対応）
- [x] 結合結果をクリップボードへコピーおよび成功通知表示

### タスク3: 基本的なエラー処理
- [x] ファイルが見つからない場合のエラーハンドリング
- [x] ユーザーへの情報・警告・エラーメッセージ表示機能
- [x] エラーログ出力機能

### タスク4: 基本ドキュメント
- [x] インストール手順の具体化
- [x] 使用方法のステップバイステップガイド
- [x] 次期バージョンの開発計画更新

## 残りのタスク

### タスク5: 拡張エラー処理 ⚠️
- [ ] 大量/重複/循環参照の検出と対応
- [ ] パフォーマンス最適化と大容量ファイル対応

### タスク6: テスト拡充 ⚠️
- [ ] Lint + Prettierの連携を強化
- [ ] 単体テストの拡充（ファイル検出、パス解決、テキスト置換など）
- [ ] 統合テストの実装（エンドツーエンドのテスト）
- [ ] 手動テストのチェックリスト作成
- [ ] エッジケースのテスト（大容量ファイル、特殊文字を含むパスなど）

### タスク7: デプロイと公開準備 ❌
- [ ] VSIX パッケージの作成とローカルテスト
- [ ] 公開用アセット準備（アイコン、スクリーンショット、詳細説明）
- [ ] 独立したライセンスファイルの追加
- [ ] 初期バージョンのリリースノート作成

### タスク8: 追加ドキュメント ⚠️
- [ ] トラブルシューティングセクションの強化
- [ ] 開発者向けドキュメントの作成（コントリビューションガイド）
- [ ] サンプル使用例の追加

### タスク9: インテリジェントなファイルパス解決の実装 ⚠️
- [ ] プロジェクトルートからの絶対パス検索機能の実装
- [ ] 近接性ベースの相対パス検索ロジックの追加
- [ ] 複数候補がある場合のユーザー選択UIの実装
- [ ] エラーメッセージの改善と検索候補の提示機能
- [ ] 検索パフォーマンスの最適化（キャッシュ機構など）

```

## タスク内容

```
### タスク5: 拡張エラー処理 ⚠️
- [ ] 大量/重複/循環参照の検出と対応
- [ ] パフォーマンス最適化と大容量ファイル対応

### タスク9: インテリジェントなファイルパス解決の実装 ⚠️
- [ ] プロジェクトルートからの絶対パス検索機能の実装
- [ ] 近接性ベースの相対パス検索ロジックの追加
- [ ] 複数候補がある場合のユーザー選択UIの実装
- [ ] エラーメッセージの改善と検索候補の提示機能
- [ ] 検索パフォーマンスの最適化（キャッシュ機構など）
```
