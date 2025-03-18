import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockVSCodeEnvironment, resetMockVSCodeEnvironment } from './mocks/vscodeEnvironment.mock';
import { mockLogManager, resetMockLogManager } from './mocks/logManager.mock';

// Mock VSCodeEnvironment
vi.mock('../../utils/vscodeEnvironment', () => ({
  VSCodeEnvironment: mockVSCodeEnvironment
}));

// Mock LogManager
vi.mock('../../utils/logManager', () => ({
  LogManager: mockLogManager
}));

// Mock vscode module
vi.mock('vscode', () => {
  return {
    window: {
      showInformationMessage: vi.fn(),
      showErrorMessage: vi.fn(),
      showWarningMessage: vi.fn()
    },
    env: {
      clipboard: {
        writeText: vi.fn()
      }
    }
  };
});

import { FileExpander } from '../../fileExpander';
import { ParameterProcessor } from '../../parameterProcessor';
import { SectionExtractor } from '../../sectionExtractor';

describe('Extension Test Suite', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetMockVSCodeEnvironment();
    resetMockLogManager();
  });
  
  it('FileExpander should be defined', () => {
    expect(FileExpander).toBeDefined();
  });

  it('ParameterProcessor should be defined', () => {
    expect(ParameterProcessor).toBeDefined();
  });

  it('SectionExtractor should be defined', () => {
    expect(SectionExtractor).toBeDefined();
  });

  it('SectionExtractor.extractSection should extract content correctly', () => {
    const markdown = `# Heading 1
Content 1

## Heading 2
Content 2

# Heading 3
Content 3`;

    const section = SectionExtractor.extractSection(markdown, 'Heading 2');
    expect(section?.includes('Content 2')).toBe(true);
    expect(section?.includes('Heading 1')).toBe(false);
  });
});
