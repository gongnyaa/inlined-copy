# inlined-copy プロジェクト構造

このドキュメントは、inlined-copyプロジェクトのファイル・フォルダ構造と各コンポーネントの概要を提供します。リファクタリングの参考として使用してください。

## プロジェクト概要

inlined Copyは、VSCode上でMarkdownファイルなどに記述された特殊記法（`![[ファイル名]]`や`{{パラメータ名}}`など）を解析し、指定したファイル内容や見出し単位の内容をインライン展開してコピーするVS Code拡張機能です。

## ファイル・フォルダ構造

```
inlined-copy/
├── .eslintrc.json           # ESLintの設定ファイル
├── .gitignore               # Gitの無視ファイル設定
├── .vscode/                 # VS Code設定ディレクトリ
├── .vscodeignore            # VS Code拡張機能パッケージング時の除外設定
├── LICENSE                  # MITライセンスファイル
├── README.md                # プロジェクト説明書
├── node_modules/            # 依存パッケージディレクトリ
├── out/                     # コンパイル後のJavaScriptファイル出力先
├── package.json             # プロジェクト設定・依存関係定義
├── pnpm-lock.yaml           # pnpm依存関係ロックファイル
├── prompt/                  # 指示書ドキュメント
├── src/                     # ソースコードディレクトリ
│   ├── errors/              # エラー処理関連
│   │   └── errorTypes.ts    # カスタムエラータイプ定義
│   ├── extension.ts         # 拡張機能のエントリーポイント
│   ├── fileExpander.ts      # ファイル参照展開ロジック
│   ├── fileResolver/        # ファイルパス解決関連
│   │   ├── fileResolver.ts  # インテリジェントなファイルパス解決
│   │   └── fileResult.ts    # ファイル操作結果型定義
│   ├── parameterProcessor.ts # パラメータ処理ロジック
│   ├── sectionExtractor.ts  # 見出しセクション抽出ロジック
│   ├── test/                # テストディレクトリ
│   └── utils/               # ユーティリティ関数
│       └── vscodeEnvironment.ts # VS Code環境操作ラッパー
├── tasks.md                 # 開発タスク・ロードマップ
├── tsconfig.json            # TypeScript設定
└── vitest.config.ts         # Vitestテスト設定
```

## 主要コンポーネントの説明

### 1. コアファイル

#### extension.ts
拡張機能のエントリーポイント。VS Codeの起動時に実行され、コマンドの登録やファイル変更監視の設定を行います。`inlined-copy.copyInline`コマンドを登録し、エディタのテキストを処理してクリップボードにコピーする機能を提供します。

#### fileExpander.ts
ファイル参照展開の中心的なロジックを実装。`![[ファイル名]]`や`![[ファイル名#見出し]]`形式の参照を検出し、対応するファイル内容や見出しセクションに置き換えます。再帰的な参照展開、循環参照検出、重複参照処理などの機能も含みます。

#### parameterProcessor.ts
`{{パラメータ名}}`や`{{パラメータ名=デフォルト値}}`形式のパラメータプレースホルダを処理します。ユーザーに値の入力を促し、指定された値でプレースホルダを置き換えます。

#### sectionExtractor.ts
Markdownファイル内の見出しセクションを抽出するロジックを実装。`![[ファイル名#見出し]]`形式の参照で使用され、指定された見出しから次の同レベル見出しまでの内容を抽出します。

### 2. ファイル解決システム

#### fileResolver/fileResolver.ts
複数の戦略を使用してファイルパスを解決するインテリジェントなシステム：
1. 直接パス解決（絶対パスまたは相対パス）
2. プロジェクトルートベースの解決
3. 近接性ベースの解決（親ディレクトリを検索）
4. ワークスペース全体での検索

#### fileResolver/fileResult.ts
ファイル操作の結果を表す型定義。成功または失敗の状態と追加情報を含みます。

### 3. エラー処理

#### errors/errorTypes.ts
拡張機能固有のエラータイプを定義：
- `LargeDataException`: ファイルサイズが制限を超えた場合
- `DuplicateReferenceException`: 同じファイルが複数回参照された場合
- `CircularReferenceException`: ファイル間で循環参照が検出された場合
- `RecursionDepthException`: 再帰の深さが制限を超えた場合

### 4. ユーティリティ

#### utils/vscodeEnvironment.ts
VS Code APIへのアクセスをラップし、テスト可能性を向上させるユーティリティクラス。クリップボード操作、メッセージ表示、設定取得などの機能を提供します。

### 5. 設定ファイル

#### package.json
拡張機能のメタデータ、コマンド定義、キーバインディング、設定オプションを定義します。主な設定項目：
- `maxSearchDepth`: 近接性ベースのファイル検索の最大深度
- `maxFileSize`: 処理する最大ファイルサイズ（バイト単位）
- `maxRecursionDepth`: 再帰的なファイル展開の最大深度
- `maxParameterRecursionDepth`: パラメータ展開の最大深度

#### tsconfig.json
TypeScriptコンパイラの設定を定義します。

#### .eslintrc.json
コードスタイルとリンティングルールを定義します。

### 6. テスト

#### src/test/
拡張機能のテストコードを含むディレクトリ。

#### vitest.config.ts
Vitestテストフレームワークの設定ファイル。

## 開発ワークフロー

1. **インストール**: `pnpm install`
2. **コンパイル**: `pnpm run compile`
3. **デバッグ起動**: `F5`キーまたは`code --extensionDevelopmentPath=${PWD}`
4. **テスト実行**: `pnpm test`
5. **リント実行**: `pnpm run lint`

## 拡張機能の動作フロー

1. ユーザーが`Ctrl+Shift+P`でコマンドパレットを開き、「Inlined Copy: Copy Inline」を選択
2. 現在のエディタ内容を取得
3. `fileExpander.expandFileReferences()`でファイル参照を展開
4. `parameterProcessor.processParameters()`でパラメータを処理
5. 処理されたテキストをクリップボードにコピー
6. 成功メッセージを表示

## 将来の拡張計画

`tasks.md`に詳細が記載されていますが、主な計画は以下の通りです：

1. Ver 1 – `![[ファイル名]]` 展開コピー
2. Ver 2 – `![[ファイル名#見出し名]]` 展開コピー
3. Ver 3 – 参照タグの補完機能
4. Ver 4 – `{{パラメータ名}}` 入力機能 – Key-Value
5. Ver 5 – `{{パラメータ名}}` 入力機能 – 初期値設定
6. Ver 6 – `{{パラメータ名}}` 入力機能 – Json形式に対応
7. Ver 7 – Markdownプレビュー統合
