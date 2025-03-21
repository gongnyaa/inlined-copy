import { describe, test, expect } from 'vitest';
import { SectionExtractor } from '../../sectionExtractor';

describe('Nested Section Extraction', () => {
  test('should extract nested heading sections correctly', () => {
    const content = [
      '# Main Title',
      'Some intro text',
      '## Parent Section',
      'Parent content',
      '### Child Section',
      'Child content',
      '### Another Child',
      'More child content',
      '## Another Parent',
      'Another parent content'
    ].join('\n');
    
    const extracted = SectionExtractor.extractNestedSection(content, ['Parent Section', 'Child Section']);
    const expected = [
      '### Child Section',
      'Child content'
    ].join('\n');
    
    expect(extracted).toBe(expected);
  });
  
  test('should return null if parent heading is not found', () => {
    const content = [
      '# Main Title',
      '## Existing Section',
      'Some content'
    ].join('\n');
    
    const extracted = SectionExtractor.extractNestedSection(content, ['Non-existent Parent', 'Child']);
    expect(extracted).toBeNull();
  });
  
  test('should return null if child heading is not found', () => {
    const content = [
      '# Main Title',
      '## Parent Section',
      'Parent content',
      '### Existing Child',
      'Child content'
    ].join('\n');
    
    const extracted = SectionExtractor.extractNestedSection(content, ['Parent Section', 'Non-existent Child']);
    expect(extracted).toBeNull();
  });
  
  test('should not extract child sections outside the parent section scope', () => {
    const content = [
      '# Main Title',
      '## First Parent',
      'First parent content',
      '### Child in First',
      'Child content in first',
      '## Second Parent',
      'Second parent content',
      '### Child in Second',
      'Child content in second'
    ].join('\n');
    
    // This should extract the Child in First, not Child in Second
    const extracted = SectionExtractor.extractNestedSection(content, ['First Parent', 'Child in First']);
    expect(extracted).toContain('Child content in first');
    expect(extracted).not.toContain('Child content in second');
    
    // Same child heading name but in different parent
    const extractedFromSecond = SectionExtractor.extractNestedSection(content, ['Second Parent', 'Child in Second']);
    expect(extractedFromSecond).toContain('Child content in second');
    expect(extractedFromSecond).not.toContain('Child content in first');
  });
  
  test('should handle deeply nested headings (3+ levels)', () => {
    const content = [
      '# Book',
      '## Chapter 1',
      '### Section 1.1',
      '#### Subsection 1.1.1',
      'Deep content here',
      '#### Subsection 1.1.2',
      'More deep content',
      '### Section 1.2',
      '## Chapter 2'
    ].join('\n');
    
    const extracted = SectionExtractor.extractNestedSection(content, ['Chapter 1', 'Section 1.1', 'Subsection 1.1.1']);
    expect(extracted).toContain('Deep content here');
    expect(extracted).not.toContain('More deep content');
  });
});
