# inlined-copy

## Overview

inlined Copy is a VS Code extension that parses special notations in Markdown files and expands them by inlining content from referenced files or sections, then copies the result to the clipboard.

Developed as an open-source project, it's designed for the following workflows:

- Streamlining document template creation and content reuse
- Referencing multiple files using the ![[filename]] notation for batch copying
- Supporting section-level copying and parameter substitution ({{parameter}})

## Key Features (Roadmap)

This project releases features incrementally. The implementation items for each version are as follows:

### 1. Ver 1 – ![[filename]] Expansion and Copy

- Detect ![[filename]] and copy the entire content of the target file
- Support for file paths (relative/absolute)
- Intelligent path resolution including project root search, proximity-based search, and workspace-wide search
- Display selection UI when multiple file candidates exist
- Suggest similar files when a file is not found

### 2. Ver 2 – ![[filename#heading]] Section Expansion

- Extract and copy heading sections with ![[filename#heading]]
- Support for various markdown heading levels and multiple sections

### 3. Ver 3 – Reference Tag Completion

- Display file list suggestions when typing ![[
- Show heading list suggestions when typing #

### 4. Ver 4 – {{parameter}} Input Function – Key-Value

- Replace {{parameter}} with user-specified key-value input
- Display popup during copy to get values from user and substitute

### 5. Ver 5 – {{parameter}} Input Function – Default Values

- Support {{parameter=defaultValue}} syntax with default values in popup
- Use default value if input field is empty

### 6. Ver 6 – {{parameter}} Input Function – JSON Format Support

- Enable **batch input** mechanism for multiple parameters (JSON format)
- Example: Input {"name": "Devin", "project": "inlined Copy"} all at once

### 7. Ver 7 – Markdown Preview Integration

- Real-time expansion of ![[...]] and {{...}} in VS Code Markdown preview
- Easier confirmation before copying

## Installation

- **Development version**: Clone the GitHub repository, run `pnpm install && pnpm run compile`, then install using VS Code's "Extensions: Install from VSIX..." command.
- **After marketplace publication**: Search for "inlined Copy" in the VS Code extensions tab and install.

## Usage

### Basic Usage

1. **Open the command palette**: `Ctrl + Shift + P` (Mac: `Cmd + Shift + P`)
2. Select the **Inlined Copy: Copy Inline** command
3. The extension will analyze the current editor content, expand all ![[...]] references and {{...}} parameters
4. The processed text will be copied to the clipboard, ready to be pasted anywhere

You can also use the keyboard shortcut: `Ctrl + Shift + C` (Mac: `Cmd + Shift + C`)

### Supported Notations

- `![[filename]]` - Expands to the entire content of the referenced file
  - Supports various path formats: relative, absolute, project root, proximity-based paths
  - Displays selection UI when multiple file candidates exist
- `![[filename#heading]]` - Expands to the section under the specified heading in the referenced file
- `{{parameter}}` - Prompts for a value to replace the parameter
- `{{parameter=defaultValue}}` - Prompts for a value with a default

Note: Additional features and settings may be added in future versions.

## Contributing

- Contributions via [Fork & PR] are welcome
- Please open issues for bug reports or feature suggestions
- For code conventions and linting, refer to CONTRIBUTING.md (coming soon)

## Development

### Technology Stack

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

### Code Quality and Style Guidelines

#### Code Style and Lint Rules

ESLint and Prettier are used to check code quality and style. All code must be free of ESLint errors and conform to Prettier formatting rules before committing. ESLint primarily detects code that could lead to bugs or uses deprecated syntax, while Prettier enforces code formatting (whitespace, line breaks, etc.). Developers should regularly check for warnings and errors from these tools.

#### Automatic Formatting

The project adopts Prettier's default style guide (with team-specific configurations as needed). **As a rule, do not format code manually**; use the editor's formatter feature or the provided scripts (see below) for automatic formatting.

- If auto-formatting on save is enabled, styles will be applied during development. If not, you can use `pnpm run prettier:fix` to format all files.
- If you need to exclude files from Prettier formatting, specify them in `.prettierignore`.

#### ESLint Rules

The ESLint configuration is based on `eslint:recommended` and `@typescript-eslint/recommended`, following basic best practices. Some important rules include:

- Prohibition of unused variables (no-unused-vars)
- Prohibition of implicit any (@typescript-eslint/no-explicit-any, etc., enforced by strict mode)
- Removal of console output and debug code (rules added as needed)

Rules that conflict with Prettier have been disabled. For detailed rule sets, see `.eslintrc.json` in the project root.

#### TypeScript Type Checking

Type errors are detected before building using TypeScript compilation (`tsc --noEmit`). Developers should pay attention to type errors displayed in the editor and not leave type inconsistencies unresolved. When developing VS Code extensions, be sure to correctly import VS Code API type definitions (vscode.d.ts) and ensure there are no type errors.

#### Testing

Vitest is used as the unit testing framework. Verify that all test cases pass with `pnpm run test` or `pnpm test`. When adding new features or fixing bugs, add tests whenever possible to improve coverage.

#### Pre-commit Hooks

Git hooks are set up to automatically run lint-staged, type checks, and tests when committing. **Code validation runs automatically during commits, and commits will be blocked if there are issues.**

- **lint-staged**: Only checks and formats files that are staged for commit, improving performance by not processing the entire codebase. It automatically re-stages formatted files before the commit is completed.
- **Type checking**: Ensures all TypeScript code is type-safe, regardless of whether it's staged or not.
- **Tests**: Verifies that all tests pass before allowing the commit.

Important notes about the pre-commit workflow:
- If a hook fails, error details will be displayed in the terminal. Follow the instructions to fix the issues, then run `git add` and `git commit` again (you'll need to make a new commit after fixing).
- If you need to temporarily skip hook processing (for emergency commits, etc.), you can disable it by setting the environment variable: `HUSKY=0 git commit ...`. However, as a rule, maintain the practice of passing quality checks before committing.
- Be aware that lint-staged will automatically re-stage files after formatting, so the committed content may differ slightly from what you initially staged (but will be properly formatted).
- The `pretest` script no longer runs linting before tests to avoid duplicate linting operations, as lint-staged already handles this during commit.

#### Recommended Editor Settings

If you're using VS Code, we recommend installing the ESLint and Prettier extensions and configuring them to automatically format and fix on save. Check the project's `.vscode/extensions.json` and `.vscode/settings.json` for recommended settings. This enables seamless static analysis and code formatting during development.

#### Command List

Here's a list of useful scripts for developers and their purposes:

- `pnpm run lint`: Run ESLint static analysis check
- `pnpm run lint:fix`: Run ESLint automatic fixes
- `pnpm run prettier:check`: Run Prettier format verification
- `pnpm run prettier:fix`: Run Prettier automatic formatting
- `pnpm run typecheck`: Run TypeScript type checking only
- `pnpm run test`: Run tests (currently using Vitest)

Note that these may also be used in CI, so be sure to verify they work locally before pushing.

### Setup

1. Install pnpm
2. Run `pnpm install`
3. Press F5 to launch debugging

### Local Test

```
pnpm install    # first time only
pnpm run compile
code --extensionDevelopmentPath=${PWD}
code . --extensionDevelopmentPath=$PWD
```

Open the command palette with Ctrl+Shift+P (Mac: Cmd+Shift+P) and select "Inlined Copy: Copy Inline"

### Building and Packaging

To build the extension:

```
pnpm run compile
```

To package the extension as a VSIX file:

```
pnpm install -g @vscode/vsce
vsce package
```

### Known Limitations

- The extension currently only works with local files
- File search cache is automatically updated when files change

## Troubleshooting

This section provides solutions for common issues you might encounter when using the inlined-copy extension.

### Common Issues and Solutions

#### Issue: File Not Found Errors

**Symptoms:**
- Error message: "File not found"
- Referenced file is not expanded in the output

**Solutions:**
1. Check that the file path is correct and the file exists
2. Try using different path formats (relative, absolute, or from project root)
3. Ensure the file is within your workspace or a parent directory
4. Check for special characters in the file path that might need escaping

#### Issue: Circular References

**Symptoms:**
- Error message: "Circular reference detected"
- Expansion process stops unexpectedly

**Solutions:**
1. Check your files for circular dependencies (A references B, B references A)
2. Break the circular chain by removing one of the references
3. Consider restructuring your documents to avoid circular dependencies

#### Issue: Large File Warnings

**Symptoms:**
- Error message: "File size exceeds maximum allowed limit"
- File content is not expanded

**Solutions:**
1. Increase the `maxFileSize` setting in VS Code preferences
2. Split large files into smaller, more manageable files
3. Consider using section references instead of entire file references

#### Issue: Recursion Depth Exceeded

**Symptoms:**
- Error message: "Maximum recursion depth exceeded"
- Nested references are not fully expanded

**Solutions:**
1. Increase the `maxRecursionDepth` setting (up to the maximum of 3)
2. Restructure your documents to reduce nesting depth
3. Consider using multiple expansion steps for deeply nested structures

### Debugging

If you encounter issues not covered above:

1. Enable debug mode in settings:
   - Set `inlined-copy.debugMode` to `true`
   - Set `inlined-copy.logLevel` to `debug`

2. Check the Output panel in VS Code:
   - Open the Output panel (View > Output)
   - Select "inlined Copy" from the dropdown menu
   - Look for error messages or warnings

3. Try with a minimal example:
   - Create a simple test file with only the problematic reference
   - Test expansion to isolate the issue

4. Report issues:
   - If the problem persists, open an issue on GitHub
   - Include your debug logs, example files, and steps to reproduce

### Error Handling

The extension includes robust error handling for various scenarios:

- **Large File Detection**: Files exceeding the configured size limit will not be processed to prevent performance issues
- **Duplicate Reference Detection**: When the same file is referenced multiple times, only the first occurrence is expanded
- **Circular Reference Detection**: Detects and prevents infinite loops caused by files referencing each other
- **Recursion Depth Limit**: Controls how many levels of nested file references will be expanded
- **File Not Found**: Provides suggestions for similar files when a referenced file cannot be found

#### Error Messages

- **Large Data Exception**: "File size exceeds maximum allowed limit" - The file is too large to process
- **Duplicate Reference**: "Duplicate reference detected" - The same file is referenced multiple times
- **Circular Reference**: "Circular reference detected" - A circular dependency between files was found
- **Recursion Depth Exceeded**: "Maximum recursion depth exceeded" - Too many levels of nested references
- **File Not Found**: "File not found" - The referenced file could not be located

### Configuration Options

The extension provides the following configuration options:

- **inlined-copy.maxFileSize**: Maximum file size in bytes (default: 5MB)

  - Prevents processing files larger than this size to avoid performance issues
  - Example: Set to 10485760 for a 10MB limit

- **inlined-copy.maxRecursionDepth**: Maximum depth for recursive file expansion (default: 1, max: 3)

  - Controls how many levels of nested file references will be expanded
  - Higher values allow more complex document structures but may impact performance
  - Example: Set to 2 to expand references within referenced files (but not further)

- **inlined-copy.maxParameterRecursionDepth**: Maximum depth for parameter expansion (default: 1, max: 3)

  - Controls how deeply nested parameters are expanded inside referenced files
  - Value 1: Parameters in the main document are processed, but not in referenced files
  - Value 2: Parameters in the main document and one level of referenced files are processed
  - Value 3: Parameters in the main document and two levels of referenced files are processed

- **inlined-copy.logLevel**: Log level for the extension (default: "info")

  - Controls the verbosity of logs in the output channel and console
  - Available levels: "none", "error", "warn", "info", "debug"
  - Higher levels include all lower level logs (e.g., "info" includes "error" and "warn")
  - Set to "debug" for detailed troubleshooting information

- **inlined-copy.debugMode**: Enable debug mode (default: false)
  - When enabled, shows more detailed logs and messages to the user
  - Useful for extension development and troubleshooting

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

- Guidelines for handling type errors related to VS Code API mocking
- Use `vi.mock('vscode')` and implement only the necessary APIs to avoid type errors
- Use the `MockUri` class to mock VS Code URI objects
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

- MIT License

Copyright (c) 2025 gongnyaa

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
