import { IFileResolver } from './FileResolverService';
import { vi } from 'vitest';

export const mockFileResolverService: IFileResolver = {
  resolveFilePath: vi.fn().mockResolvedValue('/test/path/file.txt'),
};
