# inlined-copy プロジェクト構造


## gitの対象外のファイル・フォルダ

```
inlined-copy/
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
│   └── utils/               # ユーティリティ関数
│       └── vscodeEnvironment.ts # VS Code環境操作ラッパー
├── asset/                   # マーケット用素材
├── test/                    # 結合テスト
├── prompt/                  # 指示書ドキュメント
├── docs/                    # ドキュメント
├── .eslintrc.json           # ESLintの設定ファイル
├── .gitignore               # Gitの無視ファイル設定
├── .prettierrc.json         # Prettierの設定ファイル
├── .prettierignore          # Prettierの無視ファイル設定
├── .vscode/                 # VS Code設定ディレクトリ
├── .vscodeignore            # VS Code拡張機能パッケージング時の除外設定
├── .windsurfrules           # windsurfカスタムインストラクション
├── LICENSE                  # MITライセンスファイル
├── README.md                # ユーザ向け説明書
├── CONTRIBUTING.md          # 開発者向け説明書
├── CHANGELOG.md             # 変更履歴
├── package.json             # プロジェクト設定・依存関係定義
├── tsconfig.json            # TypeScript設定
└── vitest.config.ts         # Vitestテスト設定
```

## 補足事項
単体テストは、対象ファイルと同じフォルダ内にファイル名.test.ts
