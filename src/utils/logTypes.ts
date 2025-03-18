/**
 * Log levels for the LogManager
 */
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4
}

/**
 * Configuration keys for logging
 */
export const LOG_CONFIG = {
  SECTION: 'inlined-copy',
  LOG_LEVEL: 'logLevel',
  DEBUG_MODE: 'debugMode'
};
