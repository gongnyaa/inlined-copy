import * as fs from 'fs';
import * as path from 'path';
import { FileResolver } from './fileResolver/fileResolver';
import { LargeDataException, CircularReferenceException } from './errors/errorTypes';
import { IVSCodeEnvironment, VSCodeEnvironment } from './utils/vscodeEnvironment';
import { ILogManager, LogManager } from './utils/logManager';

export interface IFileExpander {
  /**
   *
   */
  expandFileReferences(
    text: string,
    basePath: string,
    visitedPaths?: string[],
    currentDepth?: number
  ): Promise<string>;
}

export class FileExpander implements IFileExpander {
  private static _instance: IFileExpander;
  private _vscodeEnvironment: IVSCodeEnvironment;
  private _logManager: ILogManager;

  constructor(
    vscodeEnvironment: IVSCodeEnvironment = VSCodeEnvironment.Instance(),
    logManager: ILogManager = LogManager.Instance()
  ) {
    this._vscodeEnvironment = vscodeEnvironment;
    this._logManager = logManager;
  }

  public static Instance(): IFileExpander {
    if (!this._instance) {
      this._instance = new FileExpander();
    }
    return this._instance;
  }

  public static SetInstance(instance: IFileExpander): void {
    this._instance = instance;
  }

  public async expandFileReferences(
    text: string,
    basePath: string,
    visitedPaths: string[] = [],
    currentDepth: number = 0
  ): Promise<string> {
    const MAX_RECURSION_DEPTH = this._vscodeEnvironment.getConfiguration(
      'inlined-copy',
      'maxRecursionDepth',
      1
    );

    if (currentDepth > MAX_RECURSION_DEPTH) {
      this._logManager.log(
        `maxRecursionDepthを超える深さ:${currentDepth}のファイル参照が行われたため、そのまま表記します。`
      );
      return text;
    }

    const fileReferenceRegex = /!\[\[(.*?)\]\]/g;
    let result = text;
    let match;

    while ((match = fileReferenceRegex.exec(text)) !== null) {
      const fullMatch = match[0];
      const filePath = match[1].trim();

      try {
        const resolvedPath = await this.resolveFilePath(filePath, basePath);

        if (visitedPaths.includes(resolvedPath)) {
          const pathChain = [...visitedPaths, resolvedPath].map(p => path.basename(p)).join(' → ');
          throw new CircularReferenceException(`Circular reference detected: ${pathChain}`);
        }

        const fileContent = await this.readFileContent(resolvedPath);
        let contentToInsert = fileContent;

        const newVisitedPaths = [...visitedPaths, resolvedPath];
        contentToInsert = await this.expandFileReferences(
          contentToInsert,
          path.dirname(resolvedPath),
          newVisitedPaths,
          currentDepth + 1
        );

        result = result.replace(fullMatch, contentToInsert);
      } catch (error) {
        if (error instanceof Error && error.message.startsWith('File not found:')) {
          this._logManager.log(`![[${filePath}]] が見つかりませんでした`);
        } else {
          if (error instanceof LargeDataException) {
            this._logManager.log(`大きなファイルを検出: ${error.message}`);
          } else if (error instanceof CircularReferenceException) {
            this._logManager.error(error.message);
          } else {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this._logManager.error(`ファイル参照の展開エラー: ${errorMessage}`);
          }
        }

        result = result.replace(fullMatch, fullMatch);
      }
    }

    return result;
  }

  private async resolveFilePath(filePath: string, basePath: string): Promise<string> {
    const result = await FileResolver.resolveFilePath(filePath, basePath);

    if (!result.success) {
      await FileResolver.getSuggestions(filePath);
      throw new Error(`ファイルが見つかりません: ${filePath}`);
    }

    return result.path;
  }

  private async readFileContent(filePath: string): Promise<string> {
    try {
      const stats = fs.statSync(filePath);

      const MAX_FILE_SIZE = this._vscodeEnvironment.getConfiguration(
        'inlined-copy',
        'maxFileSize',
        1024 * 1024 * 5 // デフォルト5MB
      );

      if (stats.size > MAX_FILE_SIZE) {
        throw new LargeDataException(
          `ファイルサイズ(${(stats.size / 1024 / 1024).toFixed(2)}MB)が許容最大サイズ(${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB)を超えています`
        );
      }

      if (stats.size > MAX_FILE_SIZE / 2) {
        return this.readFileContentStreaming(filePath);
      }

      return await new Promise<string>((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
            reject(new Error(`ファイルの読み込みに失敗: ${err.message}`));
            return;
          }
          resolve(data);
        });
      });
    } catch (error) {
      if (error instanceof LargeDataException) {
        throw error;
      }
      throw new Error(
        `ファイルへのアクセスに失敗: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private readFileContentStreaming(filePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = fs.createReadStream(filePath);

      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on('error', err => {
        reject(new Error(`ファイルストリームの読み込みに失敗: ${err.message}`));
      });

      stream.on('end', () => {
        const content = Buffer.concat(chunks).toString('utf8');
        resolve(content);
      });
    });
  }
}
