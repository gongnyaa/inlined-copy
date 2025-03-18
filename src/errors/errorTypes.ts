/**
 * Custom error types for the inlined-copy extension
 */

/**
 * Exception thrown when attempting to process data that exceeds size limits
 */
export class LargeDataException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LargeDataException';
  }
}

/**
 * Exception thrown when a duplicate file reference is detected
 */
export class DuplicateReferenceException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateReferenceException';
  }
}

/**
 * Exception thrown when a circular reference is detected
 */
export class CircularReferenceException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircularReferenceException';
  }
}

/**
 * Exception thrown when recursion depth exceeds the configured limit
 */
export class RecursionDepthException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecursionDepthException';
  }
}

/**
 * Converts an Error object to a FileResult format
 * @param error The error to convert
 * @returns A FileResult object with success=false and the error message
 */
export function errorToFileResult(error: Error): import('../fileResolver/fileResult').FileResult {
  return { success: false, error: `${error.name}: ${error.message}` };
}
