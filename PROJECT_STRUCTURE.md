# inlined-copy プロジェクト構造


## gitの対象外のファイル・フォルダ

```
inlined-copy/
├── src/                     # ソースコードディレクトリ
│   ├── constants/           # 定数と文字列リソース
│   │   ├── Commands.ts      # コマンド定義
│   │   ├── DefaultMessages.ts # デフォルトメッセージ
│   │   └── Messages.ts      # メッセージキー定義
│   ├── errors/              # エラー処理関連
│   │   └── ErrorTypes.ts    # カスタムエラータイプ定義
│   ├── extension.ts         # 拡張機能のエントリーポイント（test.tsあり）
│   ├── services/            # サービス実装
│   │   ├── EditorTextService.ts    # エディタテキスト取得サービス（test.ts、mock.tsあり）
│   │   ├── FileExpanderService.ts  # ファイル参照展開サービス（mock.tsあり）
│   │   ├── FileResolverService.ts  # ファイルパス解決サービス
│   │   └── InlinedCopyService.ts   # メインサービス（test.ts、mock.tsあり）
│   └── utils/               # ユーティリティ関数
│       ├── I18n.ts          # 国際化ユーティリティ（test.ts、mock.tsあり）
│       ├── LogWrapper.ts    # ログ出力ユーティリティ（test.ts、mock.tsあり）
│       └── VSCodeWrapper.ts # VS Code環境操作ラッパー（test.ts、mock.tsあり）
├── assets/                  # マーケット用素材
├── docs/                    # ドキュメント
├── examples/                # サンプルファイル
├── prompt/                  # 指示書ドキュメント
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
├── vitest.config.ts         # Vitestテスト設定
└── vitest.setup.ts          # Vitestセットアップファイル
```

## 補足事項
単体テストは、対象ファイルと同じフォルダ内にファイル名.test.ts で作成する。

