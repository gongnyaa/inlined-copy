import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { VSCodeEnvironment } from './utils/vscodeEnvironment';
import { LogManager } from './utils/logManager';
import { LargeDataException } from './errors/errorTypes';

// Convert fs.readFile to Promise-based
const readFileAsync = promisify(fs.readFile);

// Simple cache for file contents
interface CacheEntry {
  content: string;
  timestamp: number;
}

export class FileReader {
  private static cache: Map<string, CacheEntry> = new Map();
  private static cacheTimeoutMs = 5000; // 5 seconds cache timeout

  /**
   * Read a file with caching and size restrictions
   * @param filePath Path to the file
   * @returns File content as string
   * @throws Error if file not found or too large
   */
  public static async readFile(filePath: string): Promise<string> {
    // Normalize path for cache key
    const normalizedPath = path.normalize(filePath);

    // Check cache first
    const cached = this.cache.get(normalizedPath);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.cacheTimeoutMs) {
      LogManager.debug(`Using cached content for ${normalizedPath}`);
      return cached.content;
    }

    try {
      // Check if file exists
      if (!fs.existsSync(normalizedPath)) {
        throw new Error(`File not found: ${normalizedPath}`);
      }

      // Check file size before reading
      const stats = fs.statSync(normalizedPath);
      const maxFileSizeBytes = VSCodeEnvironment.getConfiguration(
        'inlined-copy',
        'maxFileSize',
        1024 * 1024 * 5 // 5MB default
      );

      if (stats.size > maxFileSizeBytes) {
        throw new LargeDataException(
          `File size exceeds maximum allowed limit (${Math.round(stats.size / 1024)} KB > ${Math.round(maxFileSizeBytes / 1024)} KB)`
        );
      }

      // Read file
      const content = await readFileAsync(normalizedPath, 'utf8');

      // Update cache
      this.cache.set(normalizedPath, {
        content,
        timestamp: now,
      });

      return content;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('no such file or directory')) {
          throw new Error(`File not found: ${normalizedPath}`);
        }
        throw error;
      }
      throw new Error(`Unknown error reading file: ${normalizedPath}`);
    }
  }

  /**
   * Clear the file cache
   */
  public static clearCache(): void {
    this.cache.clear();
    LogManager.debug('File cache cleared');
  }

  /**
   * Set the cache timeout
   * @param timeoutMs Timeout in milliseconds
   */
  public static setCacheTimeout(timeoutMs: number): void {
    this.cacheTimeoutMs = timeoutMs;
    LogManager.debug(`File cache timeout set to ${timeoutMs}ms`);
  }
}
