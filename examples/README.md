# inlined-copy Examples

This directory contains examples demonstrating how to use the inlined-copy VS Code extension.

## Basic Examples

### File Reference Example

**Source File (example.md):**
```markdown
# Example Document

This document demonstrates the inlined-copy extension.

![[reference.md]]

More content after the reference.
```

**Referenced File (reference.md):**
```markdown
## Referenced Content

This content will be inlined when using the extension.

- Item 1
- Item 2
- Item 3
```

**Result after expansion:**
```markdown
# Example Document

This document demonstrates the inlined-copy extension.

## Referenced Content

This content will be inlined when using the extension.

- Item 1
- Item 2
- Item 3

More content after the reference.
```

### Section Reference Example

**Source File (example.md):**
```markdown
# Example Document

This document demonstrates the inlined-copy extension.

![[reference.md#Specific Section]]

More content after the reference.
```

**Referenced File (reference.md):**
```markdown
# Introduction

This is the introduction.

# Specific Section

This is the specific section that will be inlined.

- Point A
- Point B

# Other Section

This section won't be included.
```

**Result after expansion:**
```markdown
# Example Document

This document demonstrates the inlined-copy extension.

This is the specific section that will be inlined.

- Point A
- Point B

More content after the reference.
```

## Parameter Examples

### Basic Parameter Example

**Source File (example.md):**
```markdown
# Welcome Message

Hello, {{name}}!

Today is {{date}}.
```

**After parameter input:**
```markdown
# Welcome Message

Hello, John!

Today is March 19, 2025.
```

### Default Value Parameter Example

**Source File (example.md):**
```markdown
# Project Information

Project: {{project=inlined-copy}}
Version: {{version=1.0.0}}
Author: {{author=Your Name}}
```

**After parameter input (leaving defaults):**
```markdown
# Project Information

Project: inlined-copy
Version: 1.0.0
Author: Your Name
```

## Advanced Examples

### Nested References Example

**Source File (main.md):**
```markdown
# Main Document

![[sub1.md]]

End of main document.
```

**Referenced File (sub1.md):**
```markdown
## Sub-document 1

This is sub-document 1.

![[sub2.md]]

End of sub-document 1.
```

**Referenced File (sub2.md):**
```markdown
### Sub-document 2

This is sub-document 2.
```

**Result after expansion:**
```markdown
# Main Document

## Sub-document 1

This is sub-document 1.

### Sub-document 2

This is sub-document 2.

End of sub-document 1.

End of main document.
```

### Combined Features Example

**Source File (template.md):**
```markdown
# {{project}} Documentation

![[header.md]]

## Introduction

![[intro.md#Overview]]

## Features

![[features.md]]

## Created by {{author=Anonymous}}
```

**Result after expansion and parameter input:**
```markdown
# My Project Documentation

Header: Company Confidential

## Introduction

This project provides a solution for document management.

## Features

- Feature 1: Document creation
- Feature 2: Version control
- Feature 3: Export options

## Created by Jane Smith
```
