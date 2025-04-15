import { IEditorTextService } from './EditorTextService';
import { vi } from 'vitest';

export const mockEditorTextService: IEditorTextService = {
  getTextFromEditor: vi.fn().mockResolvedValue({ text: 'テストテキスト', currentDir: '/test/dir' }),
};
