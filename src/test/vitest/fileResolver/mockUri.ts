/**
 * Mock implementation of VS Code Uri class for testing
 */
export class MockUri {
  static file(path: string): any {
    return {
      fsPath: path,
      scheme: 'file',
      authority: '',
      path: path,
      query: '',
      fragment: '',
      with: () => this.file(path),
      toString: () => `file://${path}`
    };
  }
}
