# inlined-copy Development Guide

This document provides comprehensive technical information for developers working on the inlined-copy VS Code extension.

## Technology Stack

1. Node.js (v18+)
   - VS Code extension runtime environment
2. pnpm
   - Dependency management tool
   - Main commands: `pnpm install`, `pnpm update`
3. TypeScript
   - Implementation language for the extension
   - Compile: `pnpm tsc -p ./`
4. ESLint + Prettier
   - Code quality and style unification tools
   - Commands: `pnpm run lint`, `pnpm run lint:fix`
5. Vitest
   - Test framework
   - Commands: `pnpm test`, `pnpm run test:coverage`
6. VS Code Extension API
   - Extension development framework
   - Debug launch: F5 key

## Code Quality and Style Guidelines

### Code Style and Lint Rules

ESLint and Prettier are used to check code quality and style. All code must be free of ESLint errors and conform to Prettier formatting rules before committing. ESLint primarily detects code that could lead to bugs or uses deprecated syntax, while Prettier enforces code formatting (whitespace, line breaks, etc.). Developers should regularly check for warnings and errors from these tools.

### TypeScript Naming Conventions

This project follows the `@typescript-eslint/naming-convention` rule to maintain consistent naming across the codebase:

#### Variables & Constants
| Rule | Example | Notes |
|------|---------|-------|
| **Regular variables** | `camelCase` | `const filePath = "/path/to/file";` |
| **Constants (immutable)** | `UPPER_CASE` | `const MAX_RETRY_COUNT = 3;` |
| **Unused variables** | `_prefixed` | `const _unusedVariable = "not used";` (Avoids ESLint unused variable errors) |

**Unused variables (_unusedVariable)**
- As a general rule, unused variables should be removed from the code.
- However, the `_` prefix is allowed for temporarily unused variables during development or to avoid specific ESLint rules (@typescript-eslint/no-unused-vars).
- The `_` prefix explicitly indicates to other developers that "this is a temporarily unused variable" and should ideally be removed when the code is finalized.

#### Functions
| Rule | Example | Notes |
|------|---------|-------|
| **Regular functions** | `camelCase` | `function getFilePath() {}` |
| **Private methods** | `_prefixed` | `private _processFile() {}` (Allowed for JS compatibility) |

#### Types & Classes
| Rule | Example | Notes |
|------|---------|-------|
| **Classes & Interfaces** | `PascalCase` | `class FileProcessor {}` / `interface FileOptions {}` |
| **Type aliases** | `PascalCase` | `type FileMap = Map<string, string>;` |

### ESLint Configuration and Usage

This project applies the following ESLint rules to maintain code quality:

#### 1. `@typescript-eslint/naming-convention` Application
The ESLint configuration (`.eslintrc.json`) clearly defines naming conventions:

```json
{
  "rules": {
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "variable",
        "format": ["camelCase", "UPPER_CASE"],
        "leadingUnderscore": "allow"
      },
      {
        "selector": "parameter",
        "format": ["camelCase"],
        "leadingUnderscore": "allow"
      },
      {
        "selector": "property",
        "format": ["camelCase", "UPPER_CASE"],
        "leadingUnderscore": "allow"
      },
      {
        "selector": "typeLike",
        "format": ["PascalCase"]
      }
    ]
  }
}
```

- Allows unused variables with `_` prefix
- Enforces strict rules for constants (`UPPER_CASE`)
- Unifies type naming (`PascalCase`)

#### 2. `@typescript-eslint/no-unused-vars` Adjustment
ESLint configuration allows `_` prefixed variables to avoid unused variable errors:

```json
{
  "rules": {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
    ]
  }
}
```

##### Usage Rules
- ✅ `_unusedVariable` avoids ESLint warnings
- ❌ `unusedVariable` will trigger warnings if unused
- ✅ `function (_param: string) {}` won't trigger warnings for unused parameters

##### Cases where _ prefix is recommended:

✅ **Function parameters that are intentionally unused:**
- `_filePath` is potentially used in the future but currently unused, so it's prefixed with `_`
- Adding the `_` prefix avoids the ESLint @typescript-eslint/no-unused-vars rule while indicating that it's "intentionally unused"

✅ **Temporary variables during debugging:**
- Using `_debugData` as a temporary variable for debugging information, which will be removed eventually

❌ **Do not use _ prefix in the following cases:**
- **Variables that should be removed instead of being prefixed with _**
  - `_unusedValue` that is completely unnecessary should be removed rather than prefixed
- **Class properties that should be private instead**
  - Properties like `_id` should use the `private` modifier instead of relying on the underscore convention

### Automatic Formatting

The project adopts Prettier's default style guide (with team-specific configurations as needed). **As a rule, do not format code manually**; use the editor's formatter feature or the provided scripts (see below) for automatic formatting.

- If auto-formatting on save is enabled, styles will be applied during development. If not, you can use `pnpm run prettier:fix` to format all files.
- If you need to exclude files from Prettier formatting, specify them in `.prettierignore`.

### ESLint Rules

The ESLint configuration is based on `eslint:recommended` and `@typescript-eslint/recommended`, following basic best practices. Some important rules include:

- Prohibition of unused variables (no-unused-vars)
- Prohibition of implicit any (@typescript-eslint/no-explicit-any, etc., enforced by strict mode)
- Removal of console output and debug code (rules added as needed)

Rules that conflict with Prettier have been disabled. For detailed rule sets, see `.eslintrc.json` in the project root.

### TypeScript Type Checking

Type errors are detected before building using TypeScript compilation (`tsc --noEmit`). Developers should pay attention to type errors displayed in the editor and not leave type inconsistencies unresolved. When developing VS Code extensions, be sure to correctly import VS Code API type definitions (vscode.d.ts) and ensure there are no type errors.

### Pre-commit Hooks

Git hooks are set up to automatically run lint-staged, type checks, and tests when committing. **Code validation runs automatically during commits, and commits will be blocked if there are issues.**

- **lint-staged**: Only checks and formats files that are staged for commit, improving performance by not processing the entire codebase. It automatically re-stages formatted files before the commit is completed.
- **Type checking**: Ensures all TypeScript code is type-safe, regardless of whether it's staged or not.
- **Tests**: Verifies that all tests pass before allowing the commit.

Important notes about the pre-commit workflow:
- If a hook fails, error details will be displayed in the terminal. Follow the instructions to fix the issues, then run `git add` and `git commit` again (you'll need to make a new commit after fixing).
- If you need to temporarily skip hook processing (for emergency commits, etc.), you can disable it by setting the environment variable: `HUSKY=0 git commit ...`. However, as a rule, maintain the practice of passing quality checks before committing.
- Be aware that lint-staged will automatically re-stage files after formatting, so the committed content may differ slightly from what you initially staged (but will be properly formatted).
- The `pretest` script no longer runs linting before tests to avoid duplicate linting operations, as lint-staged already handles this during commit.

### Recommended Editor Settings

If you're using VS Code, we recommend installing the ESLint and Prettier extensions and configuring them to automatically format and fix on save. Check the project's `.vscode/extensions.json` and `.vscode/settings.json` for recommended settings. This enables seamless static analysis and code formatting during development.

### Command List

Here's a list of useful scripts for developers and their purposes:

- `pnpm run lint`: Run ESLint static analysis check
- `pnpm run lint:fix`: Run ESLint automatic fixes
- `pnpm run prettier:check`: Run Prettier format verification
- `pnpm run prettier:fix`: Run Prettier automatic formatting
- `pnpm run typecheck`: Run TypeScript type checking only
- `pnpm run test`: Run tests (currently using Vitest)

Note that these may also be used in CI, so be sure to verify they work locally before pushing.

## Setup

1. Install pnpm
2. Run `pnpm install`
3. Press F5 to launch debugging

## Local Test

```
pnpm install    # first time only
pnpm run compile
code --extensionDevelopmentPath=${PWD}
code . --extensionDevelopmentPath=$PWD
```

Open the command palette with Ctrl+Shift+P (Mac: Cmd+Shift+P) and select "Inlined Copy: Copy Inline"

## Building and Packaging

To build the extension:

```
pnpm run compile
```

To package the extension as a VSIX file:

```
pnpm install -g @vscode/vsce
vsce package
```

## Logging

### LogManager Overview

The extension includes a centralized `LogManager` class that provides consistent logging capabilities throughout the codebase. Key benefits include:

- **Unified logging interface** for all extension components
- **Configurable log levels** to control verbosity
- **Debug mode** for development and troubleshooting
- **Output channel integration** for persistent logs in VS Code

### Using LogManager

The `LogManager` provides four main logging methods with different severity levels:

```typescript
// Debug messages (only shown at debug log level)
LogManager.debug('Processing file reference: ' + filePath);

// Informational messages
LogManager.info('File successfully expanded', true); // Second parameter shows message to user

// Warning messages (shown to user by default)
LogManager.warn('Duplicate reference detected: ' + fileName);

// Error messages (shown to user by default)
LogManager.error('Failed to resolve file path: ' + filePath);
```

Each method accepts:

1. A message string
2. An optional boolean parameter to control whether the message is shown to the user

### Configuring Logging

Users can configure logging behavior through VS Code settings:

1. Open VS Code settings (File > Preferences > Settings)
2. Search for "inlined-copy"
3. Adjust the following settings:
   - **inlined-copy.logLevel**: Set the log verbosity ("none", "error", "warn", "info", "debug")
   - **inlined-copy.debugMode**: Enable to show more detailed messages to the user

### Best Practices

- Use appropriate log levels:
  - `debug`: Detailed information for development and troubleshooting
  - `info`: General operational information
  - `warn`: Potential issues that don't prevent operation
  - `error`: Errors that prevent successful operation
- Avoid excessive logging in performance-critical code paths
- Set log level to "error" or "warn" in production for better performance
- Enable debug mode only when troubleshooting issues

## Project-Specific Knowledge

### VS Code API

- When coding VS Code extensions, refer to the VS Code API documentation
- The official documentation is the most reliable source for VS Code extension development
- APIs from `vscode.workspace` and `vscode.window` are frequently used

### Testing

#### Overview and Best Practices

The inlined-copy extension uses a comprehensive testing approach:

- **Mock Strategy**: Layered mocking with base and specialized implementations
- **Test Isolation**: Each test runs in its own environment with proper cleanup
- **Common Utilities**: Reusable mock modules located in `src/test/vitest/mocks/`

##### Performance Testing

Performance tests use progressive scaling (1, 10, 50 files) with thresholds based on UX research:
- < 1 second: Perceived as immediate
- < 2 seconds: Maintains flow of thought
- < 5 seconds: Maximum acceptable delay for batch operations

##### Adding New Tests

When adding tests:
1. Use common mock implementations from `./mocks/` directory
2. Maintain test isolation with proper cleanup
3. Follow existing patterns for edge case coverage

#### Test Framework and Setup

- Vitest is used as the test framework for unit and integration tests
- Tests are located in `src/test/vitest/` directory, organized by component
- Use `pnpm test` to run all tests, or `pnpm run test:coverage` for coverage reports
- Mock implementations are provided for VS Code API and filesystem operations

#### Edge Case Testing

The extension includes comprehensive edge case tests to ensure reliability:

1. **Special Character Path Resolution Tests**
   - Tests handling of paths with spaces, special characters (#, $, %, !, etc.)
   - Verifies correct resolution of nested paths with special characters
   - Ensures consistent behavior across different operating systems

2. **Performance Tests**
   - Measures processing time for various file sizes (from small to 5MB+)
   - Tests scaling with multiple files (10, 50, 100+ files)
   - Ensures efficient handling of large documents with many references

3. **Circular Reference Tests**
   - Detects direct self-references (file referencing itself)
   - Identifies circular references between two files (A → B → A)
   - Handles longer circular reference chains (A → B → C → A)
   - Verifies appropriate error messages are displayed to users

#### Testing Best Practices

- Use the standard test environment setup with `setupStandardTestEnvironment()` from `helpers/testSetup.ts`
- Reset mocks in `beforeEach` hooks to ensure clean test state
- Use factory functions like `createFileExpanderMock()` for consistent mock implementations
- Mock VSCodeEnvironment for configuration tests using mockImplementation to simulate different settings
- When testing parameter processing, create helper functions to simulate the behavior without direct VSCode dependencies
- Use vi.resetAllMocks() in beforeEach to ensure clean test state
- For edge case tests, create isolated test environments with controlled file structures

### Asynchronous Processing

- Asynchronous handling is implemented using Promise-based patterns
- Many VS Code APIs are asynchronous and implemented using the `async/await` pattern
- Asynchronous operations like file operations and UI display always use Promise chains with proper error handling

### Error Handling

- Error handling is implemented using custom error classes
- Main error types: `LargeDataException`, `DuplicateReferenceException`, `CircularReferenceException`, `RecursionDepthException`
- Errors are communicated using the `FileResult` type, which includes success or failure status and additional information
- Appropriate messages are displayed based on the type of error to improve user experience
- Error handling behavior can be customized through settings (e.g., `maxFileSize`, `maxRecursionDepth`)
- For performance optimization, large files are processed using streaming, and file contents are cached

## License

MIT License - See the [LICENSE](LICENSE) file for details.