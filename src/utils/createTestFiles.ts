import * as fs from 'fs';
import * as path from 'path';

/**
 * Creates test files with special characters in their names
 * @param basePath The base path where test files will be created
 * @returns Array of created file paths
 */
export async function createTestFiles(basePath: string): Promise<string[]> {
  // Create test directory if it doesn't exist
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }
  
  // Special character filenames list
  const specialFilenames = [
    'normal file.txt',                // Space
    'file_with#hash.md',              // Hash
    'file-with-$-dollar.txt',         // Dollar
    'file_with%percent.md',           // Percent
    'file_with!exclamation.txt',      // Exclamation
    'folder with space/nested.md',    // Nested path with space
  ];
  
  // Create each file with sample content
  const createdPaths: string[] = [];
  for (const filename of specialFilenames) {
    const filePath = path.join(basePath, filename);
    const dirPath = path.dirname(filePath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Create file content (include filename for verification)
    const content = `This is a test file: ${filename}\nIt contains some sample content for testing.`;
    fs.writeFileSync(filePath, content);
    createdPaths.push(filePath);
  }
  
  return createdPaths;
}

/**
 * Creates a large test file of specified size
 * @param filePath The path where the file will be created
 * @param sizeInKB The size of the file in KB
 */
export function createLargeFile(filePath: string, sizeInKB: number): void {
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  // Generate 1KB of content
  const oneKB = 'A'.repeat(1024);
  // Repeat to reach desired size
  let content = '';
  for (let i = 0; i < sizeInKB; i++) {
    content += oneKB;
  }
  
  fs.writeFileSync(filePath, content);
}

/**
 * Cleans up test files and directories
 * @param basePath The base path to clean up
 */
export function cleanupTestFiles(basePath: string): void {
  if (fs.existsSync(basePath)) {
    fs.rmSync(basePath, { recursive: true, force: true });
  }
}
