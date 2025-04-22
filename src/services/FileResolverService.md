# FileResolverService 設計ドキュメント

## 基本情報
- 対象：FileResolverService
- 目的：既存機能の可視化とリファクタリング
- 主要メソッド：getFilePathInProject

## クラス図
```mermaid
%% FileResolverService クラス図
classDiagram
    class FileResolverService {
        <<service>>
        +getFilePathInProject(filePath: string, basePath: string) Promise~string~
    }
    
    class FileSearchService {
        <<service>>
        +findFileInBase(filePath: string, basePath: string) Promise~string~
        +findParent(basePath: string) Promise~string~
        +isInProject(checkPath: string) boolean
        +hasInBase(filePath: string, basePath: string) Promise~boolean~
    }
    
    FileResolverService --> FileSearchService : uses
    
    note for FileResolverService "プロジェクト内のファイルパスを解決する"
    note for FileSearchService "ファイル検索機能を提供する"
```

## 処理フロー
```mermaid
%% getFilePathInProject メソッドの処理フロー
flowchart TD
    A[getFilePathInProject開始] --> B[現在のパスをbasePathに設定]
    B --> C{現在のパスはプロジェクト内?}
    C -->|いいえ| D[ファイル未発見エラーをスロー]
    C -->|はい| E[現在のパスでファイル検索]
    E --> F{ファイルが存在する?}
    F -->|はい| G[ファイルパスを取得して返す]
    F -->|いいえ| H[親ディレクトリを取得]
    H --> C
    G --> I[終了]
    D --> I
```

## 仕様詳細

### サービス
- **FileResolverService**
  - プロジェクト内のファイルパスを解決するサービス
  - メソッド：getFilePathInProject
    - 引数：filePath (string), basePath (string)
    - 戻り値：Promise<string>
    - 説明：指定されたファイルのプロジェクト内での完全修飾パスを取得

- **FileSearchService**
  - ファイル検索機能を提供するサービス
  - 主要メソッド：
    - findFileInBase：指定パスでのファイル検索
    - findParent：親ディレクトリの取得
    - isInProject：パスがプロジェクト内か判定
    - hasInBase：指定パスにファイルが存在するか判定

### エラー処理
- プロジェクト外のパスが指定された場合
- ファイルが見つからない場合
- 親ディレクトリの取得に失敗した場合
