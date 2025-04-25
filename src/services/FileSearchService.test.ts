import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileSearchService } from './FileSearchService';
import { FileSearchError } from '../errors/ErrorTypes';
import { LogWrapper } from '../utils/LogWrapper';
import { mockLogWrapper } from '../utils/LogWrapper.mock';
import { VSCodeWrapper } from '../utils/VSCodeWrapper';
import { PathWrapper } from '../utils/PathWrapper';
import { mockPathWrapper } from '../utils/PathWrapper.mock';
import { mockVSCodeWrapper } from '../utils/VSCodeWrapper.mock';
import { ValidPath } from '../types/ValidPath';
import { MockValidPath, createMockValidPath } from '../types/ValidPath.mock';

// 共通エラーメッセージの定義
const TEST_ERRORS = {
  NO_EXCEPTION: '例外が発生しませんでした',
  WRONG_EXCEPTION_TYPE: '期待とは異なる例外型が発生しました',
} as const;

// VSCodeWrapperのモック
vi.mock('../utils/VSCodeWrapper');

// PathWrapperのモック
vi.mock('../utils/PathWrapper');

describe('FileSearchService', () => {
  let target: FileSearchService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(VSCodeWrapper.Instance).mockReturnValue(mockVSCodeWrapper);
    vi.mocked(PathWrapper.Instance).mockReturnValue(mockPathWrapper);
    LogWrapper.SetInstance(mockLogWrapper);
    target = FileSearchService.Instance();
  });

  describe('findFileInBase', () => {
    it('findFileInBase_HappyPath_ReturnsFoundFilePath', async () => {
      // Arrange
      const filePath = createMockValidPath('test.ts');
      const basePath = createMockValidPath('/workspace/root/src');
      const expectedPath = '/workspace/root/src/test.ts';
      // Uri型のモックオブジェクトを作成
      const mockUri = {
        fsPath: expectedPath,
        scheme: 'file',
        authority: '',
        path: expectedPath,
        query: '',
        fragment: '',
        with: vi.fn(),
        toJSON: vi.fn(),
      };
      vi.mocked(mockVSCodeWrapper.findFiles).mockResolvedValueOnce([mockUri]);

      // Act
      const result = await target.findFileInBase(filePath, basePath);

      // Assert
      expect(result).toBe(expectedPath);
    });

    it('findFileInBase_Error_ThrowsNotFoundError', async () => {
      // Arrange
      const filePath = createMockValidPath('missing.ts');
      const basePath = createMockValidPath('/workspace/root/src');
      vi.mocked(mockVSCodeWrapper.findFiles).mockResolvedValueOnce([]);

      // Act & Assert
      try {
        await target.findFileInBase(filePath, basePath);
        expect.fail(TEST_ERRORS.NO_EXCEPTION);
      } catch (error) {
        if (error instanceof FileSearchError) {
          expect(error.type).toBe('NotFound');
        } else {
          expect.fail(TEST_ERRORS.WRONG_EXCEPTION_TYPE);
        }
      }
    });

    it('findFileInBase_Error_ThrowsOutsideWorkspaceError', async () => {
      // Arrange
      const filePath = createMockValidPath('test.ts');
      const basePath = createMockValidPath('/outside/workspace');
      vi.mocked(mockVSCodeWrapper.getWorkspaceRootPath).mockReturnValue('/workspace');

      // isInWorkspaceをオーバーライド
      vi.spyOn(basePath, 'isInWorkspace').mockReturnValue(false);

      // Act & Assert
      try {
        await target.findFileInBase(filePath, basePath);
        expect.fail(TEST_ERRORS.NO_EXCEPTION);
      } catch (error) {
        if (error instanceof FileSearchError) {
          expect(error.type).toBe('OutsideWorkspace');
        } else {
          expect.fail(TEST_ERRORS.WRONG_EXCEPTION_TYPE);
        }
      }
    });
  });

  describe('findParent', () => {
    it('findParent_HappyPath_ReturnsParentDirectory', async () => {
      // Arrange
      const testPath = createMockValidPath('/workspace/test/path');

      // Act
      const result = await target.findParent(testPath);

      // Assert
      expect(result).toBe('/workspace/test');
    });

    it('findParent_Error_ThrowsOutsideWorkspaceError', async () => {
      // Arrange
      const testPath = createMockValidPath('/outside/workspace');
      vi.mocked(mockVSCodeWrapper.getWorkspaceRootPath).mockReturnValue('/workspace');

      // isInWorkspaceをオーバーライド
      vi.spyOn(testPath, 'isInWorkspace').mockReturnValue(false);

      // Act & Assert
      try {
        await target.findParent(testPath);
        expect.fail(TEST_ERRORS.NO_EXCEPTION);
      } catch (error) {
        if (error instanceof FileSearchError) {
          expect(error.type).toBe('OutsideWorkspace');
        } else {
          expect.fail(TEST_ERRORS.WRONG_EXCEPTION_TYPE);
        }
      }
    });

    it('findParent_HappyPath_ReturnsRootParentForWorkspace', async () => {
      // Arrange
      const workspacePath = createMockValidPath('/workspace');

      // Act
      const result = await target.findParent(workspacePath);

      // Assert
      expect(result).toBe('/');
    });
  });

  describe('isInProject', () => {
    it('isInProject_HappyPath_ReturnsTrueForPathInProject', () => {
      // Arrange
      const checkPath = createMockValidPath('/workspace/root/src');
      vi.spyOn(checkPath, 'isInWorkspace').mockReturnValue(true);

      // Act
      const result = target.isInProject(checkPath);

      // Assert
      expect(result).toBe(true);
    });

    it('isInProject_HappyPath_ReturnsFalseForPathOutsideProject', () => {
      // Arrange
      const checkPath = createMockValidPath('/outside/workspace');
      vi.spyOn(checkPath, 'isInWorkspace').mockReturnValue(false);

      // Act
      const result = target.isInProject(checkPath);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('hasInBase', () => {
    it('hasInBase_HappyPath_ReturnsTrueWhenFileExists', async () => {
      // Arrange
      const filePath = createMockValidPath('test.ts');
      const basePath = createMockValidPath('/workspace/root/src');
      // Uri型のモックオブジェクトを作成
      const mockUri = {
        fsPath: '/workspace/root/src/test.ts',
        scheme: 'file',
        authority: '',
        path: '/workspace/root/src/test.ts',
        query: '',
        fragment: '',
        with: vi.fn(),
        toJSON: vi.fn(),
      };
      vi.mocked(mockVSCodeWrapper.findFiles).mockResolvedValueOnce([mockUri]);

      // Act
      const result = await target.hasInBase(filePath, basePath);

      // Assert
      expect(result).toBe(true);
    });

    it('hasInBase_HappyPath_ReturnsFalseWhenFileNotFound', async () => {
      // Arrange
      const filePath = createMockValidPath('missing.ts');
      const basePath = createMockValidPath('/workspace/root/src');
      vi.mocked(mockVSCodeWrapper.findFiles).mockResolvedValueOnce([]);

      // Act
      const result = await target.hasInBase(filePath, basePath);

      // Assert
      expect(result).toBe(false);
    });

    it('hasInBase_HappyPath_ReturnsFalseForOutsideWorkspace', async () => {
      // Arrange
      const filePath = createMockValidPath('test.ts');
      const basePath = createMockValidPath('/outside/workspace');
      vi.spyOn(basePath, 'isInWorkspace').mockReturnValue(false);
      vi.mocked(mockVSCodeWrapper.findFiles).mockRejectedValueOnce(new Error('Test error'));

      // Act
      const result = await target.hasInBase(filePath, basePath);

      // Assert
      expect(result).toBe(false);
    });
  });
});
