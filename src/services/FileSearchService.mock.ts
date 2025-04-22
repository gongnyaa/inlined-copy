import { IFileSearchService } from './FileSearchService';
import { vi } from 'vitest';

export const mockFileSearchService: IFileSearchService = {
  findFileInBase: vi.fn(),
  findParent: vi.fn(),
  isInProject: vi.fn().mockReturnValue(true),
  hasInBase: vi.fn().mockResolvedValue(true),
};
