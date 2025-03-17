import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Intelligent file path resolution for the inlined-copy extension
 * Provides multiple strategies for resolving file paths:
 * 1. Direct path resolution (absolute or relative)
 * 2. Project root-based resolution
 * 3. Proximity-based resolution (searching up parent directories)
 * 4. Workspace-wide search for matching files
 */
export class FileResolver {
  // Cache for file search results to improve performance
  private static fileCache: Map<string, string[]> = new Map();
  
  /**
   * Resolves a file path using multiple strategies
   * @param filePath The file path to resolve
   * @param basePath The base path for resolving relative paths
   * @returns The resolved absolute file path or null if not found
   */
  public static async resolveFilePath(filePath: string, basePath: string): Promise<string | null> {
    // Strategy 1: Direct path resolution (absolute or relative)
    const directPath = this.resolveDirectPath(filePath, basePath);
    if (directPath) {
      return directPath;
    }
    
    // Strategy 2: Project root-based resolution
    const rootBasedPath = await this.resolveFromProjectRoot(filePath);
    if (rootBasedPath) {
      return rootBasedPath;
    }
    
    // Strategy 3: Proximity-based resolution
    const proximityPath = await this.resolveByProximity(filePath, basePath);
    if (proximityPath) {
      return proximityPath;
    }
    
    // Strategy 4: Workspace-wide search
    const candidates = await this.findFileInWorkspace(filePath);
    if (candidates.length === 1) {
      return candidates[0];
    } else if (candidates.length > 1) {
      // If multiple candidates found, ask user to select one
      return await this.promptUserToSelectFile(candidates);
    }
    
    // No file found with any strategy
    return null;
  }
  
  /**
   * Resolves a file path directly using absolute or relative path
   * @param filePath The file path to resolve
   * @param basePath The base path for resolving relative paths
   * @returns The resolved absolute file path or null if not found
   */
  private static resolveDirectPath(filePath: string, basePath: string): string | null {
    let resolvedPath: string;
    
    if (path.isAbsolute(filePath)) {
      resolvedPath = filePath;
    } else {
      resolvedPath = path.resolve(basePath, filePath);
    }
    
    return fs.existsSync(resolvedPath) ? resolvedPath : null;
  }
  
  /**
   * Resolves a file path from the project root
   * @param filePath The file path to resolve
   * @returns The resolved absolute file path or null if not found
   */
  private static async resolveFromProjectRoot(filePath: string): Promise<string | null> {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
      return null;
    }
    
    // Remove leading slash if present for consistency
    const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    
    // Try each workspace folder as a potential project root
    for (const folder of vscode.workspace.workspaceFolders) {
      const rootPath = folder.uri.fsPath;
      const fullPath = path.join(rootPath, normalizedPath);
      
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    
    return null;
  }
  
  /**
   * Resolves a file path by searching up parent directories
   * @param filePath The file path to resolve
   * @param basePath The starting path for proximity search
   * @returns The resolved absolute file path or null if not found
   */
  private static async resolveByProximity(filePath: string, basePath: string): Promise<string | null> {
    // Maximum number of parent directories to check
    const MAX_DEPTH = 3;
    let currentDir = basePath;
    const filename = path.basename(filePath);
    
    for (let i = 0; i <= MAX_DEPTH; i++) {
      // Check if file exists in current directory
      const testPath = path.join(currentDir, filename);
      if (fs.existsSync(testPath)) {
        return testPath;
      }
      
      // Move up to parent directory
      const parentDir = path.dirname(currentDir);
      
      // Stop if we've reached the root
      if (parentDir === currentDir) {
        break;
      }
      
      currentDir = parentDir;
    }
    
    return null;
  }
  
  /**
   * Finds a file in the workspace using VS Code's search API
   * @param filePath The file path or filename to find
   * @returns Array of matching file paths
   */
  private static async findFileInWorkspace(filePath: string): Promise<string[]> {
    // Check cache first
    const cacheKey = filePath;
    if (this.fileCache.has(cacheKey)) {
      return this.fileCache.get(cacheKey) || [];
    }
    
    // Extract filename for search
    const filename = path.basename(filePath);
    
    // Create glob pattern for search
    // Using ** to search in all directories
    const searchPattern = `**/${filename}`;
    
    try {
      // Use VS Code API to find files
      const uris = await vscode.workspace.findFiles(
        searchPattern,
        '**/node_modules/**', // Exclude node_modules
        10 // Limit results to prevent performance issues
      );
      
      // Convert URIs to file paths
      const filePaths = uris.map(uri => uri.fsPath);
      
      // Cache the results
      this.fileCache.set(cacheKey, filePaths);
      
      return filePaths;
    } catch (error) {
      console.error('Error searching for files:', error);
      return [];
    }
  }
  
  /**
   * Prompts the user to select a file from multiple candidates
   * @param candidates Array of file paths to choose from
   * @returns The selected file path or null if cancelled
   */
  private static async promptUserToSelectFile(candidates: string[]): Promise<string | null> {
    if (candidates.length === 0) {
      return null;
    }
    
    // Create QuickPick items from file paths
    const items = candidates.map(filePath => {
      const filename = path.basename(filePath);
      const relativePath = vscode.workspace.asRelativePath(filePath);
      
      return {
        label: filename,
        description: relativePath,
        detail: filePath
      };
    });
    
    // Show QuickPick UI
    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Multiple files found. Select one:',
      canPickMany: false
    });
    
    return selected ? selected.detail : null;
  }
  
  /**
   * Clears the file cache
   * Should be called when files are created, deleted, or renamed
   */
  public static clearCache(): void {
    this.fileCache.clear();
  }
  
  /**
   * Gets suggested alternatives for a file that couldn't be found
   * @param filePath The file path that couldn't be resolved
   * @returns Array of suggested alternative file paths
   */
  public static async getSuggestions(filePath: string): Promise<string[]> {
    const filename = path.basename(filePath);
    
    // Search for files with similar names
    // This is a simple implementation that just looks for files with the same extension
    const extension = path.extname(filename);
    const searchPattern = `**/*${extension}`;
    
    try {
      const uris = await vscode.workspace.findFiles(
        searchPattern,
        '**/node_modules/**',
        5 // Limit to top 5 suggestions
      );
      
      return uris.map(uri => vscode.workspace.asRelativePath(uri));
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }
}
