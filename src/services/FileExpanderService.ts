import * as fs from 'fs';
import * as path from 'path';
import { FileResolverService } from './FileResolverService';
import { LargeDataError, CircularReferenceError } from '../errors/ErrorTypes';
import { IVSCodeWrapper, VSCodeWrapper, LogWrapper, SingletonBase } from '../utils';

export interface IFileExpanderService {
  /**
   * ファイル参照を展開する
   */
  expandFileReferences(
    text: string,
    basePath: string,
    visitedPaths?: string[],
    currentDepth?: number
  ): Promise<string>;
}

export class FileExpanderService
  extends SingletonBase<IFileExpanderService>
  implements IFileExpanderService
{
  private _vscodeEnvironment: IVSCodeWrapper;

  constructor(vscodeEnvironment: IVSCodeWrapper = VSCodeWrapper.Instance()) {
    super();
    this._vscodeEnvironment = vscodeEnvironment;
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
      LogWrapper.Instance().log(
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
          throw new CircularReferenceError(`Circular reference detected: ${pathChain}`);
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
        if (error instanceof Error && error.message.startsWith('ファイルが見つかりません:')) {
          LogWrapper.Instance().log(`![[${filePath}]] が見つかりませんでした`);
        } else {
          if (error instanceof LargeDataError) {
            LogWrapper.Instance().log(`大きなファイルを検出: ${error.message}`);
          } else if (error instanceof CircularReferenceError) {
            LogWrapper.Instance().error(error.message);
          } else {
            const errorMessage = error instanceof Error ? error.message : String(error);
            LogWrapper.Instance().error(`ファイル参照の展開エラー: ${errorMessage}`);
          }
        }

        result = result.replace(fullMatch, fullMatch);
      }
    }

    return result;
  }

  private async resolveFilePath(filePath: string, basePath: string): Promise<string> {
    const result = await FileResolverService.Instance().resolveFilePath(filePath, basePath);

    if (result.error) {
      await FileResolverService.Instance().getSuggestions(filePath);
      throw new Error(`ファイルが見つかりません: ${filePath}`);
    }

    return result.path!;
  }

  private async readFileContent(filePath: string): Promise<string> {
    try {
      const stats = fs.statSync(filePath);

      // デフォルト5MB
      const DEFAULT_MAX_FILE_SIZE_MB = 5;
      const MB_IN_BYTES = 1024 * 1024;
      const MAX_FILE_SIZE = this._vscodeEnvironment.getConfiguration(
        'inlined-copy',
        'maxFileSize',
        DEFAULT_MAX_FILE_SIZE_MB * MB_IN_BYTES
      );

      if (stats.size > MAX_FILE_SIZE) {
        throw new LargeDataError(
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
      if (error instanceof LargeDataError) {
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
