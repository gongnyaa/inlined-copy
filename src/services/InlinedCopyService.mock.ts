import { IInlinedCopyService } from './InlinedCopyService';
import { vi } from 'vitest';

export const mockInlinedCopyService: IInlinedCopyService = {
  executeCommand: vi.fn().mockResolvedValue(undefined),
};
