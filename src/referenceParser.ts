/**
 * Parser for file references in the format ![[filename#heading]] or ![[filename#parent-heading#child-heading]]
 */
export interface FileReference {
  filePath: string;
  headingPath?: string[]; // Changed from headingName to headingPath array
}

/**
 * Parse a reference pattern like ![[filename#parent#child]]
 * @param reference The reference string
 * @returns Parsed file path and array of headings
 */
export function parseReference(reference: string): FileReference {
  // Extract content between ![[ and ]]
  const refMatch = reference.match(/!\[\[(.*?)\]\]/);
  if (!refMatch) {
    return { filePath: '' }; // Invalid reference
  }
  
  const parts = refMatch[1].split('#');
  const filePath = parts[0].trim();
  
  // Create an array of headings (if any)
  const headingPath = parts.length > 1 
    ? parts.slice(1).map(heading => heading.trim()).filter(h => h.length > 0)
    : undefined;
  
  return {
    filePath,
    headingPath
  };
}
