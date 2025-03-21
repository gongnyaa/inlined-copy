import { detectHeadings, findHeading, HeadingInfo } from './headingDetector';

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
    
    const startIndex = content.split('\n').slice(0, targetHeading.lineIndex).join('\n').length + 
                      (targetHeading.lineIndex > 0 ? 1 : 0); // Add 1 for newline if not first line
    
    // Find the end of the section (next heading of same or higher level)
    let endIndex = content.length;
    const targetLevel = targetHeading.level;
    
    for (let i = 0; i < headings.length; i++) {
      if (headings[i].lineIndex > targetHeading.lineIndex && headings[i].level <= targetLevel) {
        const endLineIndex = headings[i].lineIndex;
        endIndex = content.split('\n').slice(0, endLineIndex).join('\n').length;
        if (endLineIndex > 0) {
          endIndex += 1; // Add 1 for newline if not first line
        }
        break;
      }
    }
    
    // Extract the section content
    return content.substring(startIndex, endIndex).trim();
  }
}
