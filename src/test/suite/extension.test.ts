import * as assert from 'assert';
import * as vscode from 'vscode';
import { FileExpander } from '../../fileExpander';
import { ParameterProcessor } from '../../parameterProcessor';
import { SectionExtractor } from '../../sectionExtractor';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('FileExpander should be defined', () => {
    assert.notStrictEqual(FileExpander, undefined);
  });

  test('ParameterProcessor should be defined', () => {
    assert.notStrictEqual(ParameterProcessor, undefined);
  });

  test('SectionExtractor should be defined', () => {
    assert.notStrictEqual(SectionExtractor, undefined);
  });

  test('SectionExtractor.extractSection should extract content correctly', () => {
    const markdown = `# Heading 1
Content 1

## Heading 2
Content 2

# Heading 3
Content 3`;

    const section = SectionExtractor.extractSection(markdown, 'Heading 2');
    assert.strictEqual(section?.includes('Content 2'), true);
    assert.strictEqual(section?.includes('Heading 1'), false);
  });
});
