import { IVSCodeWrapper } from './VSCodeWrapper';
import { vi } from 'vitest';

export const MOCK_SELECTION_TEXT = {
  text: 'モックされた選択テキスト',
  currentDir: '/mock/dir',
};

export const MOCK_DOCUMENT_TEXT = {
  text: 'モックされた文書テキスト',
  currentDir: '/mock/dir',
};

export const MOCK_NULL_TEXT = {
  text: null,
  currentDir: '',
};

export const mockGetConfiguration = <T>(section: string, key: string, defaultValue: T): T => {
  return defaultValue;
};

export const mockVSCodeWrapper: IVSCodeWrapper = {
  appendLine: vi.fn(),
  showInformationMessage: vi.fn().mockResolvedValue(undefined),
  showErrorMessage: vi.fn().mockResolvedValue(undefined),
  getConfiguration: vi.fn().mockImplementation(mockGetConfiguration),
  writeClipboard: vi.fn().mockResolvedValue(undefined),
  getSelectionText: vi.fn().mockReturnValue(MOCK_SELECTION_TEXT),
  getDocumentText: vi.fn().mockReturnValue(MOCK_DOCUMENT_TEXT),
  createUri: vi.fn().mockImplementation(path => ({ fsPath: path })),
  createRelativePattern: vi.fn().mockImplementation((base, pattern) => ({ base, pattern })),
  findFiles: vi.fn().mockResolvedValue([]),
  getWorkspaceRootPath: vi.fn().mockReturnValue('/mock/workspace'),
  dispose: vi.fn(),
};
