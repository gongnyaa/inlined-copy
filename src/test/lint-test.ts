// This file contains intentional lint errors to test ESLint configuration

// Unused variable (ESLint warning)
const _unusedVariable = 'This variable is never used';

// Missing return type (TypeScript warning)
function _missingReturnType(): string {
  return 'This function is missing a return type';
}

// Using any type (TypeScript warning)
function _useAnyType(param: unknown): unknown {
  console.log(param); // Console statement (potential ESLint warning)
  return param;
}

// Inconsistent naming convention (ESLint warning)
const _snake_case_variable = 'This variable uses snake_case instead of camelCase';

// Actual function that will be used in tests
export function lintTestFunction(): string {
  return 'This function has proper return type';
}
