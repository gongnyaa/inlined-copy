import { IFileSearchService, FileSearchResult } from './FileSearchService';
import { vi } from 'vitest';

export const mockFileSearchService: IFileSearchService = {
  findFileInBase: vi
    .fn()
    .mockImplementation((filePath: string, _basePath: string): Promise<FileSearchResult> => {
      return Promise.resolve({ path: `/mocked/path/${filePath}` });
    }),
  findParent: vi.fn().mockImplementation((basePath: string): Promise<FileSearchResult> => {
    const parentPath = basePath.split('/').slice(0, -1).join('/');
    return Promise.resolve({ path: parentPath || '/' });
  }),
};
