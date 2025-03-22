import { describe, it, expect, vi } from 'vitest';

// Mock vscode module
vi.mock('vscode', () => {
  return {
    window: {
      showInformationMessage: vi.fn(),
      showErrorMessage: vi.fn(),
      showWarningMessage: vi.fn(),
    },
    env: {
      clipboard: {
        writeText: vi.fn(),
      },
    },
  };
});

import { FileExpander } from '../../fileExpander';

describe('Extension Test Suite', () => {
  // vscode.window.showInformationMessage('Start all tests.');

  it('FileExpander should be defined', () => {
    expect(FileExpander).toBeDefined();
  });
});
