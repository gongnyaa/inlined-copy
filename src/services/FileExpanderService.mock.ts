import { IFileExpanderService } from './FileExpanderService';
import { vi } from 'vitest';

export const mockFileExpanderService: IFileExpanderService = {
  expandFileReferences: vi.fn().mockResolvedValue('展開されたテキスト'),
};
