import { vi, describe, beforeEach, it, expect } from 'vitest';
import { InlinedCopyService } from './services/InlinedCopyService';
import { VSCodeWrapper } from './utils/VSCodeWrapper';
import { mockVSCodeWrapper } from './utils/VSCodeWrapper.mock';
import { mockInlinedCopyService } from './services/InlinedCopyService.mock';
import { activate, deactivate } from './extension';
import { COMMANDS } from './constants/Commands';

vi.mock('vscode', () => {
  return {
    commands: {
      registerCommand: vi.fn(),
    },
    ExtensionContext: vi.fn(),
    Disposable: vi.fn(),
  };
});

import * as vscode from 'vscode';

describe('extension', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    InlinedCopyService.SetInstance(mockInlinedCopyService);
    VSCodeWrapper.SetInstance(mockVSCodeWrapper);
  });

  it('activate_Happy', () => {
    const mockContext: Pick<vscode.ExtensionContext, 'subscriptions'> = {
      subscriptions: { push: vi.fn() } as unknown as [],
    };

    const mockDisposable: vscode.Disposable = { dispose: vi.fn() };

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

    expect(mockInlinedCopyService.executeCommand).toHaveBeenCalledWith();

    expect(mockContext.subscriptions.push).toHaveBeenCalledWith(mockDisposable);
  });

  it('deactivate_Happy', () => {
    deactivate();

    expect(mockVSCodeWrapper.dispose).toHaveBeenCalledWith();
  });
});
