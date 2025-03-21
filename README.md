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
  - Extracts content from the heading to the next heading of equal or higher level
  - Supports heading levels 1-7 and headings with custom IDs (e.g., `## Heading {#custom-id}`)
  - Returns the original reference if the heading is not found
- `![[filename#parent-heading#child-heading]]` - Expands to the section under a nested heading path
  - Extracts the child heading section that is within the parent heading section
  - Supports multiple levels of nesting (e.g., `#grandparent#parent#child`)
  - Returns the original reference if any heading in the path is not found
- `{{parameter}}` - Prompts for a value to replace the parameter
- `{{parameter=defaultValue}}` - Prompts for a value with a default

Note: Additional features and settings may be added in future versions.

## Known Limitations

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

#### Issue: Parameter Substitution Problems

**Symptoms:**

- Parameters in referenced files are not being processed
- Parameter values are not being applied consistently across nested files
- Default values are not being used correctly

**Solutions:**

1. Check the `maxParameterRecursionDepth` setting (default: 1)
2. Increase the value if you want parameters in referenced files to be processed
3. Ensure parameter names match exactly (case-sensitive)
4. Verify that default values are properly formatted with the `=` symbol
5. For complex parameter substitution, consider using multiple expansion steps

#### Issue: Extension Not Working After Update

**Symptoms:**

- Command not found in command palette
- Extension doesn't respond when triggered
- Error messages appear when trying to use the extension

**Solutions:**

1. Reload VS Code window (Ctrl+R or Cmd+R on Mac)
2. Check for error messages in the Output panel (View > Output > inlined Copy)
3. Verify the extension is properly installed and enabled in the Extensions panel
4. Reinstall the extension if necessary
5. Check VS Code's Developer Tools (Help > Toggle Developer Tools) for JavaScript errors

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

## Contributing

Contributions via Fork & PR are welcome! Please check the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines on how to contribute to this project. For development setup and technical details, refer to [DEVELOP.md](DEVELOP.md).

## License

MIT License - See the [LICENSE](LICENSE) file for details.

## Changelog

See the [CHANGELOG.md](CHANGELOG.md) file for details on version history and updates.

Copyright (c) 2025 frecre
