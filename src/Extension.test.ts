import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import * as vscode from 'vscode';
import { InlinedCopyService } from './services/InlinedCopyService';
import { VSCodeWrapper } from './utils/VSCodeWrapper';
import { mockVSCodeWrapper } from './utils/VSCodeWrapper.mock';
import { mockInlinedCopyService } from './services/InlinedCopyService.mock';
import { activate, deactivate } from './extension';
import { COMMANDS } from './constants/Commands';

describe('extension', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    InlinedCopyService.SetInstance(mockInlinedCopyService);
    VSCodeWrapper.SetInstance(mockVSCodeWrapper);
  });

  describe('activate', () => {
    it('activate_HappyPath', () => {
      const mockContext: Pick<vscode.ExtensionContext, 'subscriptions'> = {
        subscriptions: [],
      };

      const mockDisposable = { dispose: vi.fn() };

      vi.mocked(vscode.commands.registerCommand).mockImplementation(
        (command: string, callback: () => Promise<void>) => {
          callback();
          return mockDisposable;
        }
      );

      activate(mockContext as vscode.ExtensionContext);

      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        COMMANDS.COPY_INLINE,
        expect.any(Function)
      );

      expect(mockInlinedCopyService.executeCommand).toHaveBeenCalledTimes(1);
      expect(mockInlinedCopyService.executeCommand).toHaveBeenCalledWith();

      expect(mockContext.subscriptions).toHaveLength(1);
      expect(mockContext.subscriptions[0]).toBe(mockDisposable);
    });
  });

  describe('deactivate', () => {
    it('deactivate_HappyPath', () => {
      deactivate();

      expect(mockVSCodeWrapper.dispose).toHaveBeenCalledTimes(1);
    });
  });
});
