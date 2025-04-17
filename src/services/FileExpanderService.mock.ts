import { FileExpanderService, IFileExpanderService } from './FileExpanderService';
import { vi } from 'vitest';

export const mockFileExpanderService: IFileExpanderService = {
  expandFileReferences: vi.fn().mockResolvedValue('展開されたテキスト'),
};

vi.spyOn(FileExpanderService, 'Instance').mockReturnValue(
  mockFileExpanderService as unknown as FileExpanderService
);
