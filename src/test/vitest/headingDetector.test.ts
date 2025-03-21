import { describe, it, expect } from 'vitest';
import { detectHeadings, findHeadingById, findHeadingByText, findHeading } from '../../headingDetector';

describe('Heading Detector', () => {
  it('should detect headings with custom IDs', () => {
    const content = [
      '# Main Title {#main}',
      '## Section with ID {#section-1}',
      '### Subsection {#sub1}',
      '## Regular Section'
    ].join('\n');
    
    const headings = detectHeadings(content);
    
    expect(headings.length).toBe(4);
    expect(headings[0].id).toBe('main');
    expect(headings[1].id).toBe('section-1');
    expect(headings[2].id).toBe('sub1');
    expect(headings[3].id).toBeUndefined();
  });
  
  it('should find heading by ID', () => {
    const content = [
      '# Main Title {#main}',
      '## Section with ID {#section-1}',
      '### Subsection {#sub1}'
    ].join('\n');
    
    const headings = detectHeadings(content);
    const found = findHeadingById(headings, 'section-1');
    
    expect(found).not.toBeNull();
    expect(found?.text).toBe('Section with ID');
    expect(found?.level).toBe(2);
  });
  
  it('should find heading by text', () => {
    const content = [
      '# Main Title',
      '## Section One',
      '### Subsection'
    ].join('\n');
    
    const headings = detectHeadings(content);
    const found = findHeadingByText(headings, 'Section One');
    
    expect(found).not.toBeNull();
    expect(found?.text).toBe('Section One');
    expect(found?.level).toBe(2);
  });
  
  it('should find heading by text or ID with ID taking precedence', () => {
    const content = [
      '# Main {#intro}',
      '## Intro {#main}',
      '### Another Section'
    ].join('\n');
    
    const headings = detectHeadings(content);
    
    // Should find by ID
    const foundById = findHeading(headings, 'main');
    expect(foundById?.text).toBe('Intro');
    
    // Should find by text when no ID match
    const foundByText = findHeading(headings, 'Another Section');
    expect(foundByText?.text).toBe('Another Section');
  });
  
  it('should handle case insensitivity for text matching but not for ID matching', () => {
    const content = [
      '# Main Title {#Main}',
      '## Section One {#section-1}'
    ].join('\n');
    
    const headings = detectHeadings(content);
    
    // ID matching is case-sensitive
    const foundById = findHeadingById(headings, 'Main');
    expect(foundById?.text).toBe('Main Title');
    
    const notFoundById = findHeadingById(headings, 'main');
    expect(notFoundById).toBeNull();
    
    // Text matching is case-insensitive
    const foundByText = findHeadingByText(headings, 'section one');
    expect(foundByText?.text).toBe('Section One');
  });
});
