/**
 * Types of file references supported by the extension
 */
export enum ReferenceType {
  fileOnly, // ![[filename]]
  singleHeading, // ![[filename#heading]]
  nestedHeading, // ![[filename#parent#child]]
  customId, // ![[filename#custom-id]]
}

/**
 * Represents a parsed file reference
 */
export interface FileReference {
  type: ReferenceType;
  filePath: string;
  headingPath?: string[]; // For both single and nested headings
  customId?: string; // For custom ID references
  originalReference: string; // The original reference string for error reporting
}

/**
 * Parse a reference pattern like ![[filename]], ![[filename#heading]],
 * ![[filename#parent#child]], or ![[filename#custom-id]]
 * @param reference The reference string
 * @returns Parsed reference information
 */
export function parseReference(reference: string): FileReference {
  // Extract content between ![[ and ]]
  const refMatch = reference.match(/!\[\[(.*?)\]\]/);
  if (!refMatch) {
    return {
      type: ReferenceType.fileOnly,
      filePath: '',
      originalReference: reference,
    };
  }

  const content = refMatch[1];
  const firstHashIndex = content.indexOf('#');

  if (firstHashIndex === -1) {
    // No # found, just a file reference
    return {
      type: ReferenceType.fileOnly,
      filePath: content.trim(),
      originalReference: reference,
    };
  }

  // Split into file path and heading path
  const filePath = content.substring(0, firstHashIndex).trim();
  const headingContent = content.substring(firstHashIndex + 1);

  // Special case for headings with # character in them
  if (headingContent.includes('# ')) {
    // This is a single heading with # character in it
    return {
      type: ReferenceType.singleHeading,
      filePath,
      headingPath: [headingContent.trim()],
      originalReference: reference,
    };
  }

  // Check if this is a nested heading reference (contains multiple # characters)
  const headingParts = headingContent.split('#');

  if (headingParts.length > 1) {
    // This is a nested heading reference
    const cleanHeadingParts = headingParts.map(part => part.trim()).filter(part => part.length > 0);
    return {
      type: ReferenceType.nestedHeading,
      filePath,
      headingPath: cleanHeadingParts,
      originalReference: reference,
    };
  } else {
    // This is a single heading reference
    return {
      type: ReferenceType.singleHeading,
      filePath,
      headingPath: [headingContent.trim()],
      originalReference: reference,
    };
  }
}
