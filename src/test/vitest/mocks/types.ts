import { Mock } from 'vitest';

/**
 * VS Code Environment mock interface
 */
export interface VSCodeEnvironmentMock {
  showInformationMessage: Mock;
  showWarningMessage: Mock;
  showErrorMessage: Mock;
  getConfiguration: Mock;
  writeClipboard: Mock;
  createFileSystemWatcher: Mock;
}

/**
 * FileSystem mock interface
 */
export interface FileSystemMock {
  restore: () => void;
}

/**
 * LogManager mock interface
 */
export interface LogManagerMock {
  initialize: Mock;
  debug: Mock;
  info: Mock;
  warn: Mock;
  error: Mock;
  dispose: Mock;
  getLogLevel: Mock;
  isDebugMode: Mock;
  setLogLevel: Mock;
}

/**
 * FileResolver result interface
 */
export interface FileResolverResult {
  success: boolean;
  path?: string;
  error?: string;
}

/**
 * FileExpander mock interface
 */
export interface FileExpanderMock {
  expandFileReferences: Mock;
  fileContentCache: Map<string, string>;
  expandFile: Mock;
  expandFileContent: Mock;
  expandParameters: Mock;
}
