# inlined-copy

## Overview

inlined Copy is a VS Code extension that parses special notations in Markdown files and expands them by inlining content from referenced files or sections, then copies the result to the clipboard.

Developed as an open-source project, it's designed for the following workflows:
* Streamlining document template creation and content reuse
* Referencing multiple files using the ![[filename]] notation for batch copying
* Supporting section-level copying and parameter substitution ({{parameter}})

## Key Features (Roadmap)

This project releases features incrementally. The implementation items for each version are as follows:

### 1. Ver 1 – ![[filename]] Expansion and Copy
* Detect ![[filename]] and copy the entire content of the target file
* Support for file paths (relative/absolute)
* Intelligent path resolution including project root search, proximity-based search, and workspace-wide search
* Display selection UI when multiple file candidates exist
* Suggest similar files when a file is not found

### 2. Ver 2 – ![[filename#heading]] Section Expansion
* Extract and copy heading sections with ![[filename#heading]]
* Support for various markdown heading levels and multiple sections

### 3. Ver 3 – Reference Tag Completion
* Display file list suggestions when typing ![[ 
* Show heading list suggestions when typing #

### 4. Ver 4 – {{parameter}} Input Function – Key-Value
* Replace {{parameter}} with user-specified key-value input
* Display popup during copy to get values from user and substitute

### 5. Ver 5 – {{parameter}} Input Function – Default Values
* Support {{parameter=defaultValue}} syntax with default values in popup
* Use default value if input field is empty

### 6. Ver 6 – {{parameter}} Input Function – JSON Format Support
* Enable **batch input** mechanism for multiple parameters (JSON format)
* Example: Input {"name": "Devin", "project": "inlined Copy"} all at once

### 7. Ver 7 – Markdown Preview Integration
* Real-time expansion of ![[...]] and {{...}} in VS Code Markdown preview
* Easier confirmation before copying

## Installation

* **Development version**: Clone the GitHub repository, run `pnpm install && pnpm run compile`, then install using VS Code's "Extensions: Install from VSIX..." command.
* **After marketplace publication**: Search for "inlined Copy" in the VS Code extensions tab and install.

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

* Contributions via [Fork & PR] are welcome
* Please open issues for bug reports or feature suggestions
* For code conventions and linting, refer to CONTRIBUTING.md (coming soon)

## Development

### Technology Stack

1. Node.js (v18+)
   * VS Code extension runtime environment
2. pnpm
   * Dependency management tool
   * Main commands: `pnpm install`, `pnpm update`
3. TypeScript
   * Implementation language for the extension
   * Compile: `pnpm tsc -p ./`
4. ESLint + Prettier
   * Code quality and style unification tools
   * Commands: `pnpm run lint`, `pnpm run lint:fix`
5. Vitest
   * Test framework
   * Commands: `pnpm test`, `pnpm run test:coverage`
6. VS Code Extension API
   * Extension development framework
   * Debug launch: F5 key

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

## Project-Specific Knowledge

### VS Code API

- When coding VS Code extensions, refer to the VS Code API documentation
- The official documentation is the most reliable source for VS Code extension development
- APIs from `vscode.workspace` and `vscode.window` are frequently used

### Testing

- Guidelines for handling type errors related to VS Code API mocking
- Use `vi.mock('vscode')` and implement only the necessary APIs to avoid type errors
- Use the `MockUri` class to mock VS Code URI objects
- Mock VSCodeEnvironment for configuration tests using mockImplementation to simulate different settings
- When testing parameter processing, create helper functions to simulate the behavior without direct VSCode dependencies
- Use vi.resetAllMocks() in beforeEach to ensure clean test state
- 
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

* MIT License

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
