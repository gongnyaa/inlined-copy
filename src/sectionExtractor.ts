import { detectHeadings, findHeading } from './headingDetector';

/**
 * Extracts sections from Markdown content based on headings
 */
export class SectionExtractor {
  /**
   * Extracts a section from Markdown content based on heading text or custom ID
   * @param content The Markdown content
   * @param textOrId The heading text or custom ID to extract content from
   * @returns The extracted section content or null if heading not found
   */
  public static extractSection(content: string, textOrId: string): string | null {
    if (!textOrId) {
      return content;
    }

    // Normalize the heading (remove leading # if present)
    const normalizedTextOrId = textOrId.replace(/^#+\s*/, '').trim();

    // Find all headings in the content
    const headings = detectHeadings(content);

    // Find the target heading by ID or text
    const targetHeading = findHeading(headings, normalizedTextOrId);

    if (!targetHeading) {
      return null; // Heading not found
    }

    // Get content as lines
    const lines = content.split('\n');
    const startLine = targetHeading.lineIndex;
    
    // Find the end of the section (next heading of same or higher level)
    let endLine = lines.length;
    const targetLevel = targetHeading.level;

    for (let i = 0; i < headings.length; i++) {
      if (headings[i].lineIndex > targetHeading.lineIndex && headings[i].level <= targetLevel) {
        endLine = headings[i].lineIndex;
        break;
      }
    }
    
    // Extract the section content using line-based extraction
    return lines.slice(startLine, endLine).join('\n').trimEnd();
  }

  /**
   * Extracts a nested section from Markdown content based on a heading path
   * @param content The Markdown content
   * @param headingPath Array of heading texts or IDs, from parent to child
   * @returns The extracted nested section content or null if any heading in the path is not found
   */
  public static extractNestedSection(content: string, headingPath: string[]): string | null {
    if (!headingPath || headingPath.length === 0) {
      return content;
    }

    // Start with the first heading
    let currentContent = this.extractSection(content, headingPath[0]);

    // If first heading not found, return null
    if (!currentContent) {
      return null;
    }

    // Process remaining headings in the path
    for (let i = 1; i < headingPath.length; i++) {
      currentContent = this.extractSection(currentContent, headingPath[i]);

      // If any heading in the path is not found, return null
      if (!currentContent) {
        return null;
      }
    }

    return currentContent;
  }
}
