import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockVSCodeEnvironment, resetMockVSCodeEnvironment } from '../mocks/vscodeEnvironment.mock';
import { LogLevel } from '../../../utils/logTypes';

// Use vi.hoisted to define mocks before imports
const mockOutputChannel = vi.hoisted(() => ({
  appendLine: vi.fn(),
  dispose: vi.fn(),
}));

const mockWindow = vi.hoisted(() => ({
  createOutputChannel: vi.fn().mockReturnValue(mockOutputChannel),
  showInformationMessage: vi.fn(),
  showWarningMessage: vi.fn(),
  showErrorMessage: vi.fn(),
}));

// Mock modules
vi.mock('vscode', () => ({
  window: mockWindow,
}));

vi.mock('../../../utils/vscodeEnvironment', () => ({
  VSCodeEnvironment: mockVSCodeEnvironment,
}));

import { LogManager } from '../../../utils/logManager';

describe('LogManager', () => {
  const mockContext = {
    subscriptions: [],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    resetMockVSCodeEnvironment();

    // Reset console mocks
    vi.spyOn(console, 'log').mockImplementation(vi.fn());
    vi.spyOn(console, 'warn').mockImplementation(vi.fn());
    vi.spyOn(console, 'error').mockImplementation(vi.fn());

    // Mock getConfiguration to return different log levels
    vi.mocked(mockVSCodeEnvironment.getConfiguration).mockImplementation(
      (section, key, defaultValue) => {
        if (section === 'inlined-copy' && key === 'logLevel') {
          return 'info'; // Default to info for tests
        }
        if (section === 'inlined-copy' && key === 'debugMode') {
          return false; // Default to false for tests
        }
        return defaultValue;
      }
    );

    // Initialize LogManager
    LogManager.initialize(mockContext as any);
  });

  afterEach(() => {
    LogManager.dispose();
  });

  it('should initialize and create output channel', () => {
    // Use the mockWindow directly
    expect(mockWindow.createOutputChannel).toHaveBeenCalledWith('Inlined Copy');
  });

  it('should log debug messages when log level is DEBUG', () => {
    // Set log level to DEBUG
    vi.mocked(mockVSCodeEnvironment.getConfiguration).mockImplementation(
      (section, key, defaultValue) => {
        if (section === 'inlined-copy' && key === 'logLevel') {
          return 'debug';
        }
        return defaultValue;
      }
    );

    LogManager.debug('Test debug message');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[DEBUG] Test debug message'));
  });

  it('should not log debug messages when log level is INFO', () => {
    // Set log level to INFO
    vi.mocked(mockVSCodeEnvironment.getConfiguration).mockImplementation(
      (section, key, defaultValue) => {
        if (section === 'inlined-copy' && key === 'logLevel') {
          return 'info';
        }
        return defaultValue;
      }
    );

    LogManager.debug('Test debug message');
    expect(console.log).not.toHaveBeenCalled();
  });

  it('should log info messages when log level is INFO', () => {
    LogManager.info('Test info message');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[INFO] Test info message'));
  });

  it('should not show info messages to user by default', () => {
    LogManager.info('Test info message');
    expect(mockVSCodeEnvironment.showInformationMessage).not.toHaveBeenCalled();
  });

  it('should show info messages to user when showToUser is true', () => {
    LogManager.info('Test info message', true);
    expect(mockVSCodeEnvironment.showInformationMessage).toHaveBeenCalledWith('Test info message');
  });

  it('should log warning messages when log level is WARN', () => {
    LogManager.warn('Test warning message');
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[WARN] Test warning message')
    );
  });

  it('should show warning messages to user by default', () => {
    LogManager.warn('Test warning message');
    expect(mockVSCodeEnvironment.showWarningMessage).toHaveBeenCalledWith('Test warning message');
  });

  it('should not show warning messages to user when showToUser is false', () => {
    LogManager.warn('Test warning message', false);
    expect(mockVSCodeEnvironment.showWarningMessage).not.toHaveBeenCalled();
  });

  it('should log error messages when log level is ERROR', () => {
    LogManager.error('Test error message');
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[ERROR] Test error message')
    );
  });

  it('should show error messages to user by default', () => {
    LogManager.error('Test error message');
    expect(mockVSCodeEnvironment.showErrorMessage).toHaveBeenCalledWith('Test error message');
  });

  it('should not show error messages to user when showToUser is false', () => {
    LogManager.error('Test error message', false);
    expect(mockVSCodeEnvironment.showErrorMessage).not.toHaveBeenCalled();
  });

  it('should respect log level settings', () => {
    // Set log level to ERROR
    vi.mocked(mockVSCodeEnvironment.getConfiguration).mockImplementation(
      (section, key, defaultValue) => {
        if (section === 'inlined-copy' && key === 'logLevel') {
          return 'error';
        }
        return defaultValue;
      }
    );

    LogManager.debug('Debug message');
    LogManager.info('Info message');
    LogManager.warn('Warning message');
    LogManager.error('Error message');

    expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('Debug message'));
    expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining('Info message'));
    expect(console.warn).not.toHaveBeenCalledWith(expect.stringContaining('Warning message'));
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error message'));
  });

  it('should show messages to user in debug mode', () => {
    // Set debug mode to true
    vi.mocked(mockVSCodeEnvironment.getConfiguration).mockImplementation(
      (section, key, defaultValue) => {
        if (section === 'inlined-copy' && key === 'debugMode') {
          return true;
        }
        return defaultValue;
      }
    );

    LogManager.info('Info in debug mode');

    expect(mockVSCodeEnvironment.showInformationMessage).toHaveBeenCalledWith('Info in debug mode');
  });

  it('should dispose output channel', () => {
    const mockOutputChannel = {
      appendLine: vi.fn(),
      dispose: vi.fn(),
    };

    // Use the mockWindow directly
    mockWindow.createOutputChannel.mockReturnValueOnce(mockOutputChannel as any);

    LogManager.initialize(mockContext as any);
    LogManager.dispose();

    expect(mockOutputChannel.dispose).toHaveBeenCalled();
  });
});
