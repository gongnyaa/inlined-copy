import { IFileResolverService } from './FileResolverService';
import { vi } from 'vitest';

export const mockFileResolverService: IFileResolverService = {
  getFilePathInProject: vi.fn().mockResolvedValue('/test/path/file.txt'),
};
