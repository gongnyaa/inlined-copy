import { describe, test, expect, vi, beforeEach } from 'vitest';
import { FileExpander } from '../../src/fileExpander';
import { SectionExtractor } from '../../src/sectionExtractor';
import * as fs from 'fs';
import * as path from 'path';

describe('Basic Heading Reference Test', () => {
  const testDir = '/tmp/inlined-copy-test-basic';
  const mainFile = path.join(testDir, 'main.md');
  const subFile = path.join(testDir, 'sub.md');

  beforeEach(() => {
    // 実際のファイルを作成
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    fs.writeFileSync(mainFile, '![[sub#title2]]');
    fs.writeFileSync(
      subFile,
      '## title1\nshow title1\n\n## title2\nshow title2'
    );

    // FileReaderのモックをクリア
    vi.clearAllMocks();
  });

  // 実機テスト - 実際のファイルを使用
  test('should extract only title2 section from sub.md', async () => {
    // 実際のFileReader関数を使用
    const result = await FileExpander.expandFileReferences(
      fs.readFileSync(mainFile, 'utf8'),
      testDir
    );

    // 期待される結果: title2セクションのみが表示される
    expect(result).toContain('show title2');
    expect(result).not.toContain('show title1');
    expect(result).not.toContain('![[sub#title2]]'); // 元の参照が置き換えられること
  });

  // 単体テスト - モックを使用
  test('should correctly extract heading section using SectionExtractor', () => {
    const content = '## title1\nshow title1\n\n## title2\nshow title2';
    const extracted = SectionExtractor.extractSection(content, 'title2');
    
    expect(extracted).toContain('## title2');
    expect(extracted).toContain('show title2');
    expect(extracted).not.toContain('show title1');
  });
});
