/**
 * Heading information interface
 */
export interface HeadingInfo {
  level: number; // Heading level (1-7)
  text: string; // Heading text (without formatting)
  rawText: string; // Raw text of the heading line
  lineIndex: number; // Line index in the file
  id?: string; // Custom ID if present
}

/**
 * Detects all headings in a Markdown document, including custom IDs
 * @param markdownContent The content to parse
 * @returns Array of HeadingInfo objects for all headings found
 */
export function detectHeadings(markdownContent: string): HeadingInfo[] {
  const lines = markdownContent.split('\n');
  const headings: HeadingInfo[] = [];

  // Updated regex to capture custom IDs: {#custom-id}
  const headingRegex = /^(#{1,7})\s+([^{]+)(?:\s+\{#([a-zA-Z0-9_-]+)\})?$/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(headingRegex);

    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        rawText: line,
        lineIndex: i,
        id: match[3], // Will be undefined if no ID is present
      });
    }
  }

  return headings;
}

/**
 * Finds a heading by its custom ID
 * @param headings Array of headings to search
 * @param id The custom ID to find
 * @returns The heading with matching ID or null if not found
 */
export function findHeadingById(headings: HeadingInfo[], id: string): HeadingInfo | null {
  return headings.find(h => h.id === id) || null;
}

/**
 * Finds a heading by its text
 * @param headings Array of headings to search
 * @param text The heading text to find
 * @returns The heading with matching text or null if not found
 */
export function findHeadingByText(headings: HeadingInfo[], text: string): HeadingInfo | null {
  return headings.find(h => h.text.toLowerCase() === text.toLowerCase()) || null;
}

/**
 * Finds a heading by text or ID
 * @param headings Array of headings to search
 * @param textOrId The heading text or ID to find
 * @returns The matching heading or null if not found
 */
export function findHeading(headings: HeadingInfo[], textOrId: string): HeadingInfo | null {
  // First try to find by ID (higher priority)
  const headingById = findHeadingById(headings, textOrId);
  if (headingById) {
    return headingById;
  }

  // If not found by ID, try to find by text
  return findHeadingByText(headings, textOrId);
}
