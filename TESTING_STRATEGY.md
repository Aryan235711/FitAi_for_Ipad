# System Testing Strategy

The Automated Regression Prevention System relies on a multi-layered testing strategy to ensure reliability, safety, and accuracy. This document outlines the different types of tests and their purpose.

## 1. End-to-End (E2E) and Visual Regression Tests

- **Location**: `e2e/`
- **Framework**: Playwright
- **Purpose**: These tests simulate real user interactions and validate the application's behavior from the user's perspective.
- **Visual Regression**: A subset of E2E tests that capture screenshots of components and compare them against approved "baseline" images. This is our primary defense against unintended UI changes.
- **When to Use**: To verify user flows (login, navigation) and to lock down the visual appearance of components.

## 2. Unit and Integration Tests

- **Location**: `client/src/` (co-located with components)
- **Framework**: Vitest & React Testing Library
- **Purpose**: To test individual React components and utility functions in isolation.
- **When to Use**: To verify component logic, state management, and props handling without the overhead of a full browser test.

## 3. Critical Script Safety Tests (High Importance)

- **Location**: `scripts/__tests__/`
- **Framework**: Vitest
- **Purpose**: This is the most critical set of tests for system safety. They do **not** test the application itself, but rather the **automation scripts** that perform sensitive actions like file manipulation and Git operations.
- **Example**: `scripts/__tests__/component-rollback.test.ts`

### Testing the Rollback Script

The `component-rollback.ts` script has the power to modify the repository history. Therefore, its tests are designed to be a "programmatic specification" of its safety rules.

Key behaviors verified by these tests:
- **Input Sanitization**: Ensures that only valid, well-formed component names and commit hashes are accepted.
- **Allowlist Enforcement**: Guarantees that the script will **never** attempt to roll back a file outside of the `client/src/components/` directory. This prevents accidental changes to server code, configuration, or other critical files.
- **Commit Verification**: Confirms that a target commit hash exists in the Git history before proceeding.
- **Dry-Run Default**: Verifies that the script only lists affected files by default and never performs a `git checkout` unless the `--apply` flag is used.

**To reproduce this system in another project, creating safety tests for any script that interacts with Git or the file system is not optional—it is a mandatory requirement.**