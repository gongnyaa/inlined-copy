/**
 * Mock implementation of VS Code Uri class for testing
 */
export class MockUri {
  static file(filePath: string): Record<string, unknown> {
    return {
      fsPath: filePath,
      scheme: 'file',
      authority: '',
      path: filePath,
      query: '',
      fragment: '',
      with: () => this.file(filePath),
      toString: () => `file://${filePath}`
    };
  }
}
