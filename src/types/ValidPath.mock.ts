import { ValidPath } from './ValidPath';

export class MockValidPath extends ValidPath {
  constructor(path: string) {
    super(path);
  }

  public override isInWorkspace(): boolean {
    return true;
  }
}

export const createMockValidPath = (path: string): ValidPath => {
  return new MockValidPath(path);
};
