import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resetMockVSCodeEnvironment,
  createStandardVSCodeEnvironmentMock,
} from './mocks/vscodeEnvironment.mock';
import { mockLogManager, resetMockLogManager } from './mocks/logManager.mock';

// Mock VSCodeEnvironment
vi.mock('../../utils/vscodeEnvironment', () => createStandardVSCodeEnvironmentMock());

// Mock LogManager
vi.mock('../../utils/logManager', () => ({
  LogManager: mockLogManager,
}));

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
  beforeEach(() => {
    vi.resetAllMocks();
    resetMockVSCodeEnvironment();
    resetMockLogManager();
  });

  it('FileExpander should be defined', () => {
    expect(FileExpander).toBeDefined();
  });
});
