import { describe, it, expect, vi } from 'vitest';

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
