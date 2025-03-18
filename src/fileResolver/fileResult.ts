/**
 * Result type for file resolution operations
 */
export type FileResult = { success: true; path: string } | { success: false; error: string };

/**
 * Creates a successful file result
 * @param path The resolved file path
 * @returns A successful file result
 */
export function fileSuccess(path: string): FileResult {
  return { success: true, path };
}

/**
 * Creates a failed file result
 * @param error The error message
 * @returns A failed file result
 */
export function fileFailure(error: string): FileResult {
  return { success: false, error };
}
