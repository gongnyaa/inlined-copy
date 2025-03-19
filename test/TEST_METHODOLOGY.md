# Test Methodology

This document explains the testing approach and best practices used in the inlined-copy extension test suite.

## Mock Implementation Strategy

The test suite uses a layered mocking approach:

1. **Base Mocks**: Common mock implementations for VS Code API, filesystem, etc.
2. **Specialized Mocks**: Test-specific mock behaviors built on top of base mocks
3. **Isolated Test Environments**: Each test runs in its own isolated environment

## Performance Testing Approach

Performance tests use the following methodology:

1. **Controlled Environment**: Tests run with consistent mock implementations
2. **Progressive Scaling**: Tests measure performance with increasing load (1, 10, 50 files)
3. **Threshold Rationale**: Performance thresholds are set based on user experience requirements
   - < 1 second: Perceived as immediate
   - < 2 seconds: Users maintain flow of thought
   - < 5 seconds: Maximum acceptable delay for batch processing

## Circular Reference Testing

Circular reference tests verify:

1. Detection of self-references
2. Detection of multi-file circular references
3. Proper error handling and messaging

## Adding New Tests

When adding new tests:

1. Use the common mock implementations from `./mocks/` directory
2. Maintain test isolation with proper `beforeEach` and `afterAll` cleanup
3. Clearly document test purpose and expectations

## Mock Modules

The test suite includes several reusable mock modules:

### FileExpander Mock

Located in `src/test/vitest/mocks/fileExpander.mock.ts`, this module provides:

- Configurable circular reference detection
- Performance mode for efficient testing
- Consistent API across test files

Example usage:

```typescript
import { setupFileExpanderMock } from '../mocks/fileExpander.mock';

// Set up with default options
const fileExpanderMock = setupFileExpanderMock();

// Or with custom options
const customMock = setupFileExpanderMock({
  detectCircularReferences: true,
  performanceMode: false
});
```

### FileSystem Mock

Located in `src/test/vitest/mocks/fileSystem.mock.ts`, this module provides:

- Configurable file size and content
- Custom handlers for specific files
- Consistent API across test files

Example usage:

```typescript
import { setupFileSystemMock } from '../mocks/fileSystem.mock';

// Set up with default options
const fileSystemMock = setupFileSystemMock();

// Or with custom options
const customMock = setupFileSystemMock({
  fileSize: 1024 * 1024, // 1MB
  fileContent: 'Custom content',
  getFileSize: (filePath) => {
    if (filePath.includes('large.txt')) {
      return 5 * 1024 * 1024; // 5MB
    }
    return undefined; // Fall back to default
  },
  getFileContent: (filePath) => {
    if (filePath.includes('special.md')) {
      return '# Special content';
    }
    return undefined; // Fall back to default
  }
});

// Clean up after tests
afterAll(() => {
  fileSystemMock.restore();
});
```

### VSCodeEnvironment Mock

Located in `src/test/vitest/mocks/vscodeEnvironment.mock.ts`, this module provides:

- Configurable extension settings
- Consistent API across test files

Example usage:

```typescript
import { createVSCodeEnvironmentMock, resetMockVSCodeEnvironment } from '../mocks/vscodeEnvironment.mock';

// Reset mocks before each test
beforeEach(() => {
  resetMockVSCodeEnvironment();
});

// Create with custom options
const customMock = createVSCodeEnvironmentMock({
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxRecursionDepth: 5
});
```
