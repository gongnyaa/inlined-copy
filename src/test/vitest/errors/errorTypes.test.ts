import { describe, it, expect } from 'vitest';
import {
  LargeDataException,
  DuplicateReferenceException,
  CircularReferenceException,
  errorToFileResult,
} from '../../../errors/errorTypes';

describe('Error Types', () => {
  it('should create LargeDataException with correct name and message', () => {
    const message = 'File is too large';
    const error = new LargeDataException(message);

    expect(error.name).toBe('LargeDataException');
    expect(error.message).toBe(message);
    expect(error instanceof Error).toBe(true);
  });

  it('should create DuplicateReferenceException with correct name and message', () => {
    const message = 'Duplicate reference detected';
    const error = new DuplicateReferenceException(message);

    expect(error.name).toBe('DuplicateReferenceException');
    expect(error.message).toBe(message);
    expect(error instanceof Error).toBe(true);
  });

  it('should create CircularReferenceException with correct name and message', () => {
    const message = 'Circular reference detected';
    const error = new CircularReferenceException(message);

    expect(error.name).toBe('CircularReferenceException');
    expect(error.message).toBe(message);
    expect(error instanceof Error).toBe(true);
  });

  it('should convert error to FileResult format', () => {
    const error = new Error('Test error');
    error.name = 'TestError';

    const result = errorToFileResult(error);

    expect(result.success).toBe(false);
    // Type assertion to access the error property on failed result
    expect((result as { success: false; error: string }).error).toBe('TestError: Test error');
  });
});
