/**
 * ファイル解決操作の結果型
 */
export type FileResult = { success: true; path: string } | { success: false; error: string };

/**
 * 成功したファイル結果を作成
 * @param path 解決されたファイルパス
 * @returns 成功したファイル結果
 */
export function fileSuccess(path: string): FileResult {
  return { success: true, path };
}

/**
 * 失敗したファイル結果を作成
 * @param error エラーメッセージ
 * @returns 失敗したファイル結果
 */
export function fileFailure(error: string): FileResult {
  return { success: false, error };
}
