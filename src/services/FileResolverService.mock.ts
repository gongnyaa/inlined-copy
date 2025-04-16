import { IFileResolver, fileSuccess } from './FileResolverService';
import { vi } from 'vitest';

export const mockFileResolverService: IFileResolver = {
  resolveFilePath: vi.fn().mockResolvedValue(fileSuccess('/test/path/file.txt')),
  getSuggestions: vi.fn().mockResolvedValue(['/test/path/file.txt']),
};
