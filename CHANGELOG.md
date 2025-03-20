# Change Log

All notable changes to the "inlined-copy" extension will be documented in this file.

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
