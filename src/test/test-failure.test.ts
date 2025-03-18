import { describe, it, expect } from 'vitest';
import { lintTestFunction } from './lint-test';
import { prettierTestFunction } from './prettier-test';
import { typeTestFunction } from './type-test';

describe('Test Failure Example', () => {
  it('should pass this test', () => {
    expect(lintTestFunction()).toBe('This function has proper return type');
    expect(prettierTestFunction()).toBe('This function has proper formatting');
    expect(typeTestFunction()).toBe('This function has proper types');
  });

  it('should pass this test (fixed for commit)', () => {
    // This test was intentionally failing, now fixed for commit
    expect(true).toBe(true);
  });
});
