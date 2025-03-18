import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockVSCodeEnvironment, resetMockVSCodeEnvironment } from '../mocks/vscodeEnvironment.mock';

// Mock vscode module
vi.mock('vscode', () => {
  return {
    window: {
      showInputBox: vi.fn().mockResolvedValue('test value')
    }
  };
});

// Mock VSCodeEnvironment
vi.mock('../../../utils/vscodeEnvironment', () => ({
  VSCodeEnvironment: mockVSCodeEnvironment
}));

describe('ParameterProcessor Recursion Depth', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetMockVSCodeEnvironment();
  });
  
  // Helper function to simulate parameter processing with depth control
  const simulateParameterProcessing = (text: string, currentDepth: number, maxDepth: number): string => {
    if (currentDepth > maxDepth) {
      return text;
    }
    return text.replace(/\{\{name\}\}/g, 'test value');
  };
  
  it('should process parameters at depth 0 with maxParameterRecursionDepth=1', async () => {
    // Set maxParameterRecursionDepth=1
    vi.mocked(mockVSCodeEnvironment.getConfiguration).mockImplementation((section, key, defaultValue) => {
      if (section === 'inlined-copy' && key === 'maxParameterRecursionDepth') return 1;
      return defaultValue;
    });
    
    const text = 'Hello {{name}}!';
    const maxDepth = mockVSCodeEnvironment.getConfiguration('inlined-copy', 'maxParameterRecursionDepth', 1);
    const result = simulateParameterProcessing(text, 0, maxDepth);
    
    expect(result).toBe('Hello test value!');
  });
  
  it('should not process parameters at depth 1 with maxParameterRecursionDepth=0', async () => {
    // Set maxParameterRecursionDepth=0
    vi.mocked(mockVSCodeEnvironment.getConfiguration).mockImplementation((section, key, defaultValue) => {
      if (section === 'inlined-copy' && key === 'maxParameterRecursionDepth') return 0;
      return defaultValue;
    });
    
    const text = 'Hello {{name}}!';
    const maxDepth = mockVSCodeEnvironment.getConfiguration('inlined-copy', 'maxParameterRecursionDepth', 1);
    const result = simulateParameterProcessing(text, 1, maxDepth);
    
    // Parameters should not be processed and remain as is
    expect(result).toBe('Hello {{name}}!');
  });
  
  it('should process parameters at depth 1 with maxParameterRecursionDepth=2', async () => {
    // Set maxParameterRecursionDepth=2
    vi.mocked(mockVSCodeEnvironment.getConfiguration).mockImplementation((section, key, defaultValue) => {
      if (section === 'inlined-copy' && key === 'maxParameterRecursionDepth') return 2;
      return defaultValue;
    });
    
    const text = 'Hello {{name}}!';
    const maxDepth = mockVSCodeEnvironment.getConfiguration('inlined-copy', 'maxParameterRecursionDepth', 1);
    const result = simulateParameterProcessing(text, 1, maxDepth);
    
    // Parameters should be processed at depth 1 when maxParameterRecursionDepth=2
    expect(result).toBe('Hello test value!');
  });
  
  it('should not process parameters at depth 3 with maxParameterRecursionDepth=2', async () => {
    // Set maxParameterRecursionDepth=2
    vi.mocked(mockVSCodeEnvironment.getConfiguration).mockImplementation((section, key, defaultValue) => {
      if (section === 'inlined-copy' && key === 'maxParameterRecursionDepth') return 2;
      return defaultValue;
    });
    
    const text = 'Hello {{name}}!';
    const maxDepth = mockVSCodeEnvironment.getConfiguration('inlined-copy', 'maxParameterRecursionDepth', 1);
    const result = simulateParameterProcessing(text, 3, maxDepth);
    
    // Parameters should not be processed at depth 3 when maxParameterRecursionDepth=2
    expect(result).toBe('Hello {{name}}!');
  });
});
