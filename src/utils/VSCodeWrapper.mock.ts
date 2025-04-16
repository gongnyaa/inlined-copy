import { IVSCodeWrapper } from './VSCodeWrapper';
import { vi } from 'vitest';

export const mockVSCodeWrapper: IVSCodeWrapper = {
  appendLine: vi.fn(),
  showInformationMessage: vi.fn().mockResolvedValue(undefined),
  showErrorMessage: vi.fn().mockResolvedValue(undefined),
  getConfiguration: vi
    .fn()
    .mockImplementation(<T>(section: string, key: string, defaultValue: T) => defaultValue),
  writeClipboard: vi.fn().mockResolvedValue(undefined),
  getSelectionText: vi.fn().mockReturnValue({ text: '', currentDir: '' }),
  getDocumentText: vi.fn().mockReturnValue({ text: '', currentDir: '' }),
  dispose: vi.fn(),
};
