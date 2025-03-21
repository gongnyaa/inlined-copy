# GitHub/Git Workflow

This document defines a consistent and practical GitHub/Git workflow for efficient, high-quality development.

---

## 1. Naming Conventions

| Item               | Format                                                              | Example                                             |
| ------------------ | ------------------------------------------------------------------- | --------------------------------------------------- |
| **Task plan file** | `tasks/YYYYMMDD_taskName_plan.md`                                   | `tasks/20250320_searchUI_plan.md`                   |
| **Feature branch** | `feature/YYYYMMDD_taskName`                                         | `feature/20250320_searchUI`                         |
| **Commit message** | `✨ [YYYYMMDD_taskName_stepName] Your commit message in English...` | `✨ [20250320_searchUI_plan] Add initial task plan` |

> **Note**: Even though the directory name and file names contain `YYYYMMDD_taskName`, all commit messages and content **must be in English** (no Japanese).  
> Emojis are encouraged for better readability.

---

## 2. 5-Step Workflow

### Step 1: Switch to `master` and update

1. Before starting any task, switch to the `master` branch:

   ```bash
   git checkout master
   git pull origin master
   ```

2. If there are uncommitted changes in the current working branch, make sure to commit or stash them before switching.

3. **Important**: After pulling, automated checks will run (see [Automation Tools](#6-automation-tools)). If any checks fail, resolve those issues before proceeding.

### Step 2: Create & approve the task plan

1. Clarify the task scope, goals, and references.
2. Create a new task plan file under tasks/ with the format:
   ```
   tasks/YYYYMMDD_taskName_plan.md
   ```
3. Include the task overview, objectives, steps, estimates, and any important notes.
4. Submit the plan for review and approval.

Example of a task plan file (`tasks/20250320_searchUI_plan.md`):

```markdown
# [searchUI] Task Plan

## Overview

- Brief description of what needs to be done.

## Objectives

- Clearly define the goals.

## Steps & Estimates

1. Step one
   - Estimated time: 2h
   - Notes / documents to refer: @some_reference.md
2. Step two
   - Estimated time: 1h
   - Notes / documents to refer: @another_reference.md

## Work Log

_(Leave this empty initially; update it during development)_
```

### Step 3: Create a feature branch

After the task plan is approved, create a new feature branch based on master:

```bash
git checkout -b feature/20250320_searchUI
git add tasks/20250320_searchUI_plan.md
git commit -m "✨ [20250320_searchUI_plan] Add initial task plan"
```

Use the format `feature/YYYYMMDD_taskName`.

### Step 4: Develop & commit (step-by-step)

1. Implement each step of your task plan.
2. After each step, update the "Work Log" in the plan file:
   - What was done?
   - Any issues encountered?
   - Proposed solutions or improvements?
3. Commit your changes following these guidelines:
   - Language: English only
   - Emoji: Allowed at the beginning (e.g., ✨, 🐛, 📝, etc.)
   - Message: `[YYYYMMDD_taskName_stepName]` style so it's traceable
   - Conventional Commits: Use the format below

#### Commit Message Format

```
<type>(<scope>): <subject> (<skip ci>)

<body>

<footer>
```

- **type** (required):
  | Type | Description |
  |------|-------------|
  | `feat` | A new feature |
  | `fix` | A bug fix |
  | `docs` | Documentation only changes |
  | `style` | Changes that do not affect meaning (formatting, etc.) |
  | `refactor` | Code changes that neither fix a bug nor add a feature |
  | `perf` | Code change that improves performance |
  | `test` | Adding missing tests or correcting existing tests |
  | `build` | Changes to the build process or external dependencies |
  | `ci` | Changes to CI configuration files or scripts |
  | `chore` | Other changes that do not modify source or test files |

- **scope** (optional): The specific scope or module (e.g., auth, api, dashboard).
- **subject** (required): A short imperative description of the changes.
- **(skip ci)** (optional): If the commit only changes documentation or something that does not need CI, you can add (skip ci) to skip the pipeline.
- **body** (optional): More detailed explanatory text if needed.
- **footer** (optional): Reference issues, e.g. Closes #123.

Example (using emoji + conventional commits):

```bash
git commit -m "✨ feat(searchUI): Add new search component

Implemented a basic search component for the homepage.
Includes partial integration with the existing API.

Closes #45
"
```

### Step 5: Push & create a Pull Request (PR)

1. When all task steps are complete, push the branch:

   ```bash
   git push origin feature/20250320_searchUI
   ```

2. Open a Pull Request targeting master using the PR template (see [PR Template](#5-pull-request-template)).

3. Once the PR is reviewed and approved:

   ```bash
   git checkout master
   git merge --no-ff feature/20250320_searchUI -m "Merge feature/20250320_searchUI"
   git push origin master
   ```

4. In the task plan file, add a final work completion section indicating:
   - Date of completion
   - Summary of what was achieved
   - Any follow-up or improvement ideas

---

## 3. Branch Strategy

| Branch Type | Purpose                                                    | Naming Convention           |
| ----------- | ---------------------------------------------------------- | --------------------------- |
| `master`    | The stable production branch, always in a deployable state | `master`                    |
| `feature/*` | For new features or enhancements                           | `feature/YYYYMMDD_taskName` |
| `fix/*`     | For bug fixes                                              | `fix/YYYYMMDD_taskName`     |

---

## 4. Pull Request Rules

1. The base branch must be master.
2. At least one reviewer is required.
3. All tests must pass before merging.
4. No lint errors allowed.
5. Clearly describe the changes and their potential impact in the PR description.
6. Reference the corresponding task plan file in the PR.
7. Use the PR template when creating the PR.

---

## 5. Pull Request Template

Create a file at `.github/pull_request_template.md` with the following content:

```markdown
## Description

<!-- Provide a brief description of the changes in this PR -->

## Related Task

<!-- Link to the task plan (e.g., tasks/20250320_searchUI_plan.md) -->

## Type of Change

<!-- Mark the appropriate option with an "x" -->

- [ ] Feature (new functionality)
- [ ] Fix (bug fix)
- [ ] Refactor (code improvement without functional changes)
- [ ] Documentation (updates to documentation)
- [ ] Other (please describe):

## Implementation Details

<!-- Describe the implementation approach and any important technical decisions -->

## Testing

<!-- Describe how these changes were tested -->

## Screenshots (if applicable)

<!-- Add screenshots to help explain your changes -->

## Checklist

<!-- Mark completed items with an "x" -->

- [ ] My code follows the project's coding standards
- [ ] I have updated the documentation accordingly
- [ ] All tests pass locally
- [ ] I have added tests that prove my fix/feature works
- [ ] The task plan work log has been updated
```

---

## 6. Automation Tools

### Pre-Pull Checks

Set up a script (e.g., `scripts/pre-pull-check.sh`) to run before working on any new task:

```bash
#!/bin/bash
# scripts/pre-pull-check.sh

echo "Running pre-pull checks..."

# Run linting
echo "Running lint checks..."
npm run lint
LINT_STATUS=$?

# Run type checking
echo "Running type checks..."
npm run typecheck
TYPE_STATUS=$?

# Run tests
echo "Running tests..."
npm run test
TEST_STATUS=$?

# Check if any checks failed
if [ $LINT_STATUS -ne 0 ] || [ $TYPE_STATUS -ne 0 ] || [ $TEST_STATUS -ne 0 ]; then
  echo "❌ Pre-pull checks failed. Please fix the issues before continuing your work."
  exit 1
else
  echo "✅ All pre-pull checks passed!"
  exit 0
fi
```

Add to your `.bashrc` or `.zshrc`:

```bash
# Add this alias to your shell configuration
alias git-pull='git pull && ./scripts/pre-pull-check.sh'
```

### Pre-Commit Hooks

1. Install required packages:

```bash
npm install --save-dev husky lint-staged
```

2. Configure Husky in `package.json`:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test"
    }
  },
  "lint-staged": {
    "*.{js,ts,tsx,jsx}": ["eslint --fix", "prettier --write", "npm run typecheck"],
    "*.{css,scss,less}": ["stylelint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

3. Create `.huskyrc` file:

```json
{
  "hooks": {
    "pre-commit": "lint-staged",
    "pre-push": "npm run test"
  }
}
```

4. Create `.lintstagedrc` file:

```json
{
  "*.{js,ts,tsx,jsx}": ["eslint --fix", "prettier --write", "tsc --noEmit"],
  "*.{css,scss,less}": ["stylelint --fix", "prettier --write"],
  "*.{json,md}": ["prettier --write"]
}
```

### Commitlint

1. Install commitlint:

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

2. Create `.commitlintrc.json`:

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "header-max-length": [2, "always", 100],
    "subject-case": [0],
    "type-enum": [2, "always", ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert"]]
  }
}
```

3. Add to husky hooks:

```json
{
  "hooks": {
    "commit-msg": "commitlint -E HUSKY_GIT_PARAMS",
    "pre-commit": "lint-staged",
    "pre-push": "npm run test"
  }
}
```

---

## 7. Summary

By following this 5-step workflow with consistent English commit messages, naming conventions, and automated checks, your team can:

- Streamline the development process
- Maintain high-quality, trackable changes
- Ensure code quality through automated checks
- Standardize PR creation and review processes
- Minimize integration issues and conflicts

This workflow is designed to be practical and efficient while maintaining strict quality standards throughout the development lifecycle.
