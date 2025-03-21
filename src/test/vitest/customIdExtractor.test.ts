import { describe, it, expect } from 'vitest';
import { SectionExtractor } from '../../sectionExtractor';

describe('Custom ID Section Extraction', () => {
  it('should extract section using custom ID reference', () => {
    const content = [
      '# Main Title',
      'Some intro text',
      '## Section One {#sec1}',
      'Content in section one',
      '## Section Two {#sec2}',
      'Content in section two',
      '### Subsection {#sub2}',
      'Subsection content',
    ].join('\n');

    const extracted = SectionExtractor.extractSection(content, 'sec2');
    const expected = [
      '## Section Two {#sec2}',
      'Content in section two',
      '### Subsection {#sub2}',
      'Subsection content',
    ].join('\n');

    expect(extracted).toBe(expected);
  });

  it('should prioritize ID over text when both exist', () => {
    const content = [
      '# Document',
      '## Introduction {#intro}',
      'First introduction',
      '## intro',
      'Second introduction',
    ].join('\n');

    // Should extract the section with ID "intro", not the heading with text "intro"
    const extracted = SectionExtractor.extractSection(content, 'intro');
    expect(extracted).toContain('First introduction');
    expect(extracted).not.toContain('Second introduction');
  });

  it('should fall back to text matching when ID is not found', () => {
    const content = [
      '# Main Title',
      '## Section with Text',
      'Content here',
      '## Another Section {#with-id}',
      'More content',
    ].join('\n');

    const extracted = SectionExtractor.extractSection(content, 'Section with Text');
    expect(extracted).toContain('Content here');
  });

  it('should handle complex nested sections with IDs', () => {
    const content = [
      '# Document Title {#doc-title}',
      'Introduction text goes here.',
      '## First Section {#section-1}',
      'Content for the first section.',
      '### Subsection with ID {#sub1}',
      'Nested content here.',
      '### Subsection without ID',
      'More nested content.',
      '## Section with ID {#important-section}',
      'Important content here.',
      '## Section with same text {#duplicate-text}',
      'First section with this text.',
      '## Section with same text',
      'Second section with this text (no ID).',
    ].join('\n');

    // Test ID-based extraction
    const sectionById = SectionExtractor.extractSection(content, 'important-section');
    expect(sectionById).toContain('Important content here');
    expect(sectionById).not.toContain('Nested content here');

    // Test extraction of section with duplicate text but different IDs
    const duplicateSection = SectionExtractor.extractSection(content, 'duplicate-text');
    expect(duplicateSection).toContain('First section with this text');
    expect(duplicateSection).not.toContain('Second section with this text');
  });
});
