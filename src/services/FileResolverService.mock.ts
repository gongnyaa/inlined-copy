import { IFileResolver } from './FileResolverService';
import { vi } from 'vitest';

export const mockFileResolverService: IFileResolver = {
  getFilePathInProject: vi.fn().mockResolvedValue('/test/path/file.txt'),
};
