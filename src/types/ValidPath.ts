import { VSCodeWrapper } from '../utils';

/**
 * 有効なパスを表すクラス
 */
export class ValidPath {
  private readonly _value: string;

  constructor(path: string) {
    this._value = path;
  }

  /**
   * パス文字列を取得する
   */
  public get value(): string {
    return this._value;
  }

  /**
   * ワークスペース内のパスかどうかを判定する
   */
  public isInWorkspace(): boolean {
    const workspaceRoot = VSCodeWrapper.Instance().getWorkspaceRootPath();
    if (!workspaceRoot) {
      return false;
    }
    return this._value.startsWith(workspaceRoot);
  }
}
