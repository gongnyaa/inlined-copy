import { FileExpanderService, expandSuccess } from './FileExpanderService';
import { vi } from 'vitest';

export const mockFileExpanderService = {
  expandFiles: vi.fn().mockResolvedValue(expandSuccess('展開されたテキスト')),
};

vi.spyOn(FileExpanderService, 'Instance').mockReturnValue(mockFileExpanderService as any);
