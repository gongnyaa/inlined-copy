# Contributing to inlined-copy

Thank you for your interest in contributing to the inlined-copy VS Code extension! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Contributing to inlined-copy](#contributing-to-inlined-copy)
  - [Table of Contents](#table-of-contents)
  - [Development Setup](#development-setup)
    - [Prerequisites](#prerequisites)
    - [Getting Started](#getting-started)
  - [Project Structure](#project-structure)
  - [Coding Guidelines](#coding-guidelines)
    - [TypeScript Style](#typescript-style)
    - [Code Quality](#code-quality)
  - [Testing](#testing)
    - [Running Tests](#running-tests)
    - [Writing Tests](#writing-tests)
  - [Pull Request Process](#pull-request-process)
  - [Commit Message Guidelines](#commit-message-guidelines)
    - [Types](#types)
    - [Scope](#scope)
    - [Subject](#subject)
    - [Examples](#examples)
  - [License](#license)

## Development Setup

### Prerequisites

- Node.js (v18+)
- pnpm (recommended package manager)
- Visual Studio Code

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/gongnyaa/inlined-copy.git
   cd inlined-copy
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Compile the extension:
   ```bash
   pnpm run compile
   ```

4. Launch the extension in development mode:
   ```bash
   # Press F5 in VS Code
   # Or run this command:
   code --extensionDevelopmentPath=${PWD}
   ```

For more detailed technical information about the development environment, please refer to [DEVELOP.md](DEVELOP.md).

## Project Structure

```
inlined-copy/
├── src/                    # Source code directory
│   ├── extension.ts        # Main extension entry point
│   ├── fileExpander.ts     # File expansion logic
│   ├── fileResolver/       # File path resolution
│   ├── parameterProcessor.ts # Parameter processing logic
│   ├── sectionExtractor.ts # Markdown section extraction
│   ├── errors/             # Error handling
│   ├── utils/              # Utility functions
│   └── test/               # Test files
├── .vscode/                # VS Code configuration
├── test/                   # Additional test resources
├── package.json            # Extension manifest
└── tsconfig.json           # TypeScript configuration
```

## Coding Guidelines

### TypeScript Style

- Follow the ESLint and Prettier configurations provided in the project
- Use meaningful variable and function names
- Add JSDoc comments for public functions and classes
- Use strong typing and avoid `any` where possible

### Code Quality

- Run linting before submitting changes:
  ```bash
  pnpm run lint
  ```

- Fix linting issues:
  ```bash
  pnpm run lint --fix
  ```

For detailed information about the coding style, naming conventions, and other technical guidelines, please refer to the [Code Quality and Style Guidelines](DEVELOP.md#code-quality-and-style-guidelines) section in DEVELOP.md.

## Testing

The project uses Vitest for unit testing. Tests are located in the `src/test` directory.

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm run test:coverage
```

### Writing Tests

- Create test files with the `.test.ts` extension
- Place tests in the appropriate directory under `src/test/vitest/`
- Mock VS Code API dependencies using the provided mock implementations
- Test both success and error cases

For more detailed testing information and best practices, please refer to the [Testing](DEVELOP.md#testing) section in DEVELOP.md.

## Pull Request Process

1. Create a new branch from `master` with a descriptive name:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and ensure all tests pass:
   ```bash
   pnpm test
   ```

3. Commit your changes following the [commit message guidelines](#commit-message-guidelines)

4. Push your branch and create a pull request on GitHub

5. Update the PR description with:
   - A summary of the changes
   - Any relevant issue numbers
   - Testing instructions if applicable

6. Address any feedback from code reviews

## Commit Message Guidelines

Follow the conventional commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (formatting, etc.)
- **refactor**: Code changes that neither fix a bug nor add a feature
- **perf**: Code changes that improve performance
- **test**: Adding or modifying tests
- **build**: Changes to the build system or dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files

### Scope

The scope should be the name of the module affected (e.g., fileResolver, parameterProcessor).

### Subject

- Use the imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize the first letter
- No period (.) at the end

### Examples

```
feat(fileResolver): add support for project root paths

fix(parameterProcessor): resolve issue with nested parameters

docs(readme): update installation instructions
```

## License

By contributing to this project, you agree that your contributions will be licensed under the project's MIT License.