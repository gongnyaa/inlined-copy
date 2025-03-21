import { describe, it, expect } from 'vitest';
import { SectionExtractor } from '../../sectionExtractor';

describe('SectionExtractor', () => {
  it('should extract section from heading to next similar level heading', () => {
    const content = `# Main Title
Some intro text

## First Section
Content in first section

### Subsection
Subsection content

## Second Section
Content in second section`;

    const extracted = SectionExtractor.extractSection(content, 'First Section');
    const expected = `## First Section
Content in first section

### Subsection
Subsection content`;

    expect(extracted).toBe(expected);
  });

  it('should extract to the end of file if no next similar level heading', () => {
    const content = `# Main Title
Some intro text

## Last Section
Content in last section

### Subsection
Final content`;

    const extracted = SectionExtractor.extractSection(content, 'Last Section');
    const expected = `## Last Section
Content in last section

### Subsection
Final content`;

    expect(extracted).toBe(expected);
  });

  it('should return null for non-existent heading', () => {
    const content = '# Existing Heading\nSome content';
    const extracted = SectionExtractor.extractSection(content, 'Non-existent Heading');
    expect(extracted).toBeNull();
  });

  it('should handle section with multiple subheadings', () => {
    const content = `## Target Section
Main content

### First Subsection
Subsection content

### Second Subsection
More content

## Next Section`;

    const extracted = SectionExtractor.extractSection(content, 'Target Section');
    const expected = `## Target Section
Main content

### First Subsection
Subsection content

### Second Subsection
More content`;

    expect(extracted).toBe(expected);
  });

  it('should handle headings with custom IDs', () => {
    const content = `# Main Title {#main}

## Section with ID {#section-1}
Content with ID

## Section without ID
Regular content`;

    const extracted = SectionExtractor.extractSection(content, 'Section with ID');
    const expected = `## Section with ID {#section-1}
Content with ID`;

    expect(extracted).toBe(expected);
  });

  it('should support heading levels 1-7', () => {
    const content = `# H1
## H2
### H3
#### H4
##### H5
###### H6
####### H7

Some content`;

    const extracted = SectionExtractor.extractSection(content, 'H7');
    expect(extracted).toContain('####### H7');
    expect(extracted).toContain('Some content');
  });

  it('should use the first occurrence of duplicate headings', () => {
    const content = `# Main Title

## Duplicate Heading
Content A

### Subsection
Sub content

## Duplicate Heading
Content B

# Another Title`;

    const extracted = SectionExtractor.extractSection(content, 'Duplicate Heading');
    expect(extracted).toContain('Content A');
    expect(extracted).not.toContain('Content B');
  });

  it('should handle complex test cases with sample files', () => {
    // Instead of reading files, use inline content for testing
    const basicContent = `# Document Title

Introduction text goes here.

## First Section

Content for the first section.

### Subsection 1.1

Nested content here.

## Second Section

Content for the second section.`;

    const firstSection = SectionExtractor.extractSection(basicContent, 'First Section');
    expect(firstSection).toContain('Content for the first section');
    expect(firstSection).toContain('Subsection 1.1');
    expect(firstSection).not.toContain('Second Section');

    // Test with custom IDs
    const customIdsContent = `# Main Title {#main}

## Section with ID {#section-1}
Content with ID

## Section without ID
Regular content`;

    const sectionWithId = SectionExtractor.extractSection(customIdsContent, 'Section with ID');
    expect(sectionWithId).toContain('Content with ID');
    expect(sectionWithId).not.toContain('Regular content');
  });
});
