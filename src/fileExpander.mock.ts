import { IFileExpander } from './fileExpander';
import { vi } from 'vitest';

export const mockFileExpander: IFileExpander = {
  expandFileReferences: vi.fn().mockResolvedValue('展開されたテキスト'),
};
