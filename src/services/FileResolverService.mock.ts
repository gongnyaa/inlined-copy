import { IFileResolver, FileResult } from './FileResolverService';
import { vi } from 'vitest';

export const mockFileResolverService: IFileResolver = {
  resolveFilePath: vi.fn().mockResolvedValue({ path: '/test/path/file.txt' } as FileResult),
  getSuggestions: vi.fn().mockResolvedValue(['/test/path/file.txt']),
};
