# Change Log

All notable changes to the "inlined-copy" extension will be documented in this file.

## [0.5.0] - 2025-03-23

### Added

- Integrated file reference system with optimized performance
- Support for nested heading references with ![[filename#parent#child]] syntax
- Intelligent file caching for better responsiveness
- Consistent handling of all reference types

### Improved

- Robust error handling with clear user feedback
- Better performance with large files
- Enhanced section extraction for nested headings

## [0.3.0] - 2025-03-22

### Added

- Support for `![[filename#parent-heading#child-heading]]` syntax to extract nested heading sections
- Enhanced section extraction to respect heading hierarchy and parent-child relationships

## [0.2.0] - 2025-03-21

### Added

- Support for `![[filename#heading]]` syntax to extract specific sections from referenced files
- Enhanced heading detection to support heading levels 1-7
- Added support for headings with custom IDs (e.g., `## Heading {#custom-id}`)
- Extracts content from the heading to the next heading of equal or higher level

## [0.1.2] - 2025-03-21

### Fixed

- Improved file not found error handling to display as Info level messages instead of Error level
- Made error messages more concise with format "![[filename]] was not found"
- Implemented extension-less file matching to find files regardless of their extension
- Fixed issue where copy operation would not execute when a referenced file is not found

## [0.1.1] - 2025-03-20

### Fixed

- Delete useless files from vsix.

## [0.1.0] - 2025-03-20

### Added

- Initial release of inlined-copy extension
- Support for ![[filename]] notation to expand and copy file content
- Intelligent file path resolution:
  - Direct path resolution (absolute or relative)
  - Project root-based resolution
  - Proximity-based resolution (searching up parent directories)
  - Workspace-wide search for matching files
- Selection UI when multiple file candidates exist
- Suggestions for similar files when a file is not found
- Error handling for large files, duplicate references, and circular references
- Configuration options for maximum file size and recursion depth
