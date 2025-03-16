# inlined-copy

## Overview / 概要

inlined Copy is a VS Code extension that parses special notations in Markdown files and expands them by inlining content from referenced files or sections, then copies the result to the clipboard.

inlined Copyは、VSCode上でMarkdownファイルなどに記述された特殊記法を解析し、指定したファイル内容や見出し単位の内容をインライン展開してコピーする拡張機能です。

Developed as an open-source project, it's designed for the following workflows:
* Streamlining document template creation and content reuse
* Referencing multiple files using the ![[filename]] notation for batch copying
* Supporting section-level copying and parameter substitution ({{parameter}})

オープンソースとして開発され、以下のようなワークフローを想定しています:
* ドキュメントテンプレートやスニペット共有を効率化
* ![[ファイル名]] 記法で複数のファイルを参照して、一括コピー
* 見出し単位のコピーや、パラメータの差し替え（{{変数}}）にも対応

## 主要機能 (ロードマップ)

本プロジェクトは機能を段階的にリリースします。各バージョンの実装項目は次のとおりです:

### 1. Ver 1 – ![[ファイル名]] 展開コピー
* ![[ファイル名]] を検知して、対象ファイルの全文をコピー
* ファイルパス(相対/絶対)にも対応

### 2. Ver 2 – ![[ファイル名#見出し名]] 展開コピー
* ![[ファイル名#見出し名]]で見出しセクションを抽出してコピー
* マークダウンの見出しレベルや複数セクションへの対応など検討

### 3. Ver 3 – 参照タグの補完機能
* ![[入力時にファイル一覧の候補を表示
* #を入力したらファイル内の見出し一覧を候補として表示

### 4. Ver 4 – {{パラメータ名}} 入力機能 – Key-Value
* {{パラメータ名}} をユーザーが指定するKey-Value入力で置換
* コピー時にポップアップを表示し、ユーザーから値を取得して代入

### 5. Ver 5 – {{パラメータ名}} 入力機能 – 初期値設定
* {{パラメータ名=初期値}}のように書くと、初期値がポップアップに反映
* 入力欄が空の場合は初期値を使用

### 6. Ver 6 – {{パラメータ名}} 入力機能 – Json形式に対応
* 複数パラメータを**一括入力**可能にする仕組み (JSON形式)
* 例: {"name": "Devin", "project": "inlined Copy"} をまとめて入力

### 7. Ver 7 – Markdownプレビュー統合
* VSCodeのMarkdownプレビューで![[...]]や{{...}}をリアルタイム展開
* コピー前の確認が容易になる

## Installation / インストール

* **Development version**: Clone the GitHub repository, run `pnpm install && pnpm run compile`, then install using VS Code's "Extensions: Install from VSIX..." command.
* **After marketplace publication**: Search for "inlined Copy" in the VS Code extensions tab and install.

* **まだ未公開の場合**: GitHubリポジトリをクローンし、pnpm install && pnpm run compile後、VSCodeのExtensions: Install from VSIX...でインストール可能。
* **マーケットプレース公開後**: VSCodeの拡張機能タブで inlined Copy を検索し、インストール。

## Usage / 使い方

### Basic Usage / 基本的な使い方

1. **Open the command palette**: `Ctrl + Shift + P` (Mac: `Cmd + Shift + P`)
2. Select the **Inlined Copy: Copy Inline** command
3. The extension will analyze the current editor content, expand all ![[...]] references and {{...}} parameters
4. The processed text will be copied to the clipboard, ready to be pasted anywhere

You can also use the keyboard shortcut: `Ctrl + Shift + C` (Mac: `Cmd + Shift + C`)

1. **コマンドパレットを開く**: `Ctrl + Shift + P` (Mac: `Cmd + Shift + P`)
2. **Inlined Copy: Copy Inline** コマンドを選択
3. **現在のエディタ内容**を解析し、![[...]] や {{...}} 等の特殊記法を一括で展開
4. 生成されたテキストをクリップボードにコピー→任意の場所に貼り付け

キーボードショートカット: `Ctrl + Shift + C` (Mac: `Cmd + Shift + C`) も使用できます。

### Supported Notations / サポートされている記法

- `![[filename]]` - Expands to the entire content of the referenced file
- `![[filename#heading]]` - Expands to the section under the specified heading in the referenced file
- `{{parameter}}` - Prompts for a value to replace the parameter
- `{{parameter=defaultValue}}` - Prompts for a value with a default

- `![[ファイル名]]` - 参照されたファイルの全内容に展開されます
- `![[ファイル名#見出し]]` - 参照されたファイル内の指定された見出しのセクションに展開されます
- `{{パラメータ}}` - パラメータを置き換える値の入力を求めます
- `{{パラメータ=デフォルト値}}` - デフォルト値を持つ値の入力を求めます

※ バージョンによって追加機能が増え、操作手順や設定が増えることがあります。

## Contributing / 開発への参加

* Contributions via [Fork & PR] are welcome
* Please open issues for bug reports or feature suggestions
* For code conventions and linting, refer to CONTRIBUTING.md (coming soon)

* [Fork & PR] でのコントリビューションを歓迎します
* Issueを起票しバグ報告や機能提案を行ってください
* コード規約やLintなど、詳細はCONTRIBUTING.mdを参照（予定）

## Development / 開発

### Technology Stack / 技術スタック

1. Node.js (v18+)
   * VS Code extension runtime environment
   * VSCode拡張機能の実行環境
2. pnpm
   * Dependency management tool
   * 依存関係管理ツール
   * Main commands: `pnpm install`, `pnpm update`
3. TypeScript
   * Implementation language for the extension
   * 拡張機能の実装言語
   * Compile: `pnpm tsc -p ./`
4. ESLint + Prettier
   * Code quality and style unification tools
   * コード品質とスタイル統一ツール
   * Commands: `pnpm run lint`, `pnpm run lint:fix`
5. Mocha
   * Test framework
   * テストフレームワーク
   * Commands: `pnpm test`
6. VS Code Extension API
   * Extension development framework
   * 拡張機能開発フレームワーク
   * Debug launch: F5 key

### Setup / セットアップ

1. Install pnpm / pnpmインストール
2. Run `pnpm install` / `pnpm install`を実行
3. Press F5 to launch debugging / F5キーでデバッグ実行

### Building and Packaging / ビルドとパッケージング

To build the extension:
```
pnpm run compile
```

To package the extension as a VSIX file:
```
pnpm install -g @vscode/vsce
vsce package
```

### Known Limitations / 既知の制限

- Circular references between files are not currently detected
- Very large files may cause performance issues
- The extension currently only works with local files

- ファイル間の循環参照は現在検出されません
- 非常に大きなファイルはパフォーマンスの問題を引き起こす可能性があります
- 拡張機能は現在、ローカルファイルでのみ動作します

## License / ライセンス

* MIT License

Copyright (c) 2025 gongnyaa

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
