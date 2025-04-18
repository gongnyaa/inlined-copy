/**
 * シングルトンパターンの基底クラス
 *
 * このクラスは、シングルトンパターンを実装するクラスの基底クラスとして使用します。
 * Instance()メソッドでインスタンスを取得し、SetInstance()メソッドでインスタンスを設定します。
 */
export abstract class SingletonBase<_T> {
  protected static _instance: unknown;

  /**
   * シングルトンインスタンスを取得します
   * @returns シングルトンインスタンス
   */
  public static Instance<U>(this: new () => U): U {
    const constructor = this as unknown as typeof SingletonBase;
    if (!constructor._instance) {
      constructor._instance = new this();
    }
    return constructor._instance as U;
  }

  /**
   * シングルトンインスタンスを設定します
   * @param instance 設定するインスタンス
   */
  public static SetInstance<U>(this: new () => U, instance: U | null): void {
    const constructor = this as unknown as typeof SingletonBase;
    constructor._instance = instance;
  }
}
