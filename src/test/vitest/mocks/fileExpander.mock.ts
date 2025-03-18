import { vi } from 'vitest';
import { CircularReferenceException } from '../../../errors/errorTypes';

/**
 * Options for FileExpander mock configuration
 */
interface FileExpanderMockOptions {
  detectCircularReferences?: boolean;
  performanceMode?: boolean;
}

/**
 * Creates a mock implementation for FileExpander that can be reused across tests
 * @param options Configuration options for the mock
 */
export function createFileExpanderMock(options: FileExpanderMockOptions = {}) {
  const defaultOptions = {
    detectCircularReferences: true,
    performanceMode: false,
    ...options
  };
  
  return {
    expandFileReferences: vi.fn().mockImplementation((text, basePath) => {
      // CircularReference検知のモック実装（オプションで制御可能）
      if (defaultOptions.detectCircularReferences) {
        if (text.includes('self-reference.md')) {
          return Promise.reject(new CircularReferenceException('Circular reference detected: self-reference.md → self-reference.md'));
        }
        if (text.includes('fileA.md')) {
          return Promise.reject(new CircularReferenceException('Circular reference detected: fileA.md → fileB.md → fileA.md'));
        }
        if (text.includes('chainA.md')) {
          return Promise.reject(new CircularReferenceException('Circular reference detected: chainA.md → chainB.md → chainC.md → chainA.md'));
        }
      }
      
      // パフォーマンステスト用実装
      if (defaultOptions.performanceMode) {
        return Promise.resolve(text.replace(/!\[\[(.+?)\]\]/g, 'Expanded content'));
      }
      
      return Promise.resolve(text);
    }),
    fileContentCache: new Map(),
    expandFile: vi.fn().mockImplementation(() => Promise.resolve('')),
    expandFileContent: vi.fn().mockImplementation(() => Promise.resolve('')),
    expandParameters: vi.fn().mockImplementation(() => Promise.resolve(''))
  };
}

/**
 * Creates a FileExpander mock that can be used in tests
 * Note: This does not automatically install the mock
 */
export function setupFileExpanderMock(options: FileExpanderMockOptions = {}) {
  return createFileExpanderMock(options);
}
