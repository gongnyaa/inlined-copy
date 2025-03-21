// No need for vscode import as it's not used in this file

/**
 * Extracts sections from Markdown content based on headings
 */
export class SectionExtractor {
  /**
   * Extracts a section from Markdown content based on heading
   * @param content The Markdown content
   * @param heading The heading to extract content from
   * @returns The extracted section content or null if heading not found
   */
  public static extractSection(content: string, heading: string): string | null {
    if (!heading) {
      return content;
    }

    // Normalize the heading (remove leading # if present)
    const normalizedHeading = heading.replace(/^#+\s*/, '').trim();

    // Find all headings in the content (supporting h1-h7 and custom IDs)
    const headingRegex = /^(#{1,7})\s+(.+?)(?:\s+\{#[\w-]+\})?$/gm;
    const headings: { level: number; title: string; index: number }[] = [];

    let match;
    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const title = match[2].trim();
      headings.push({
        level,
        title,
        index: match.index,
      });
    }

    // Find the target heading
    const targetHeadingIndex = headings.findIndex(
      h => h.title.toLowerCase() === normalizedHeading.toLowerCase()
    );

    if (targetHeadingIndex === -1) {
      return null; // Heading not found
    }

    const targetHeading = headings[targetHeadingIndex];
    const startIndex = targetHeading.index;

    // Find the end of the section (next heading of same or higher level)
    let endIndex = content.length;
    for (let i = targetHeadingIndex + 1; i < headings.length; i++) {
      if (headings[i].level <= targetHeading.level) {
        endIndex = headings[i].index;
        break;
      }
    }

    // Extract the section content
    return content.substring(startIndex, endIndex).trim();
  }
}
