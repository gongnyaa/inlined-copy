// This file contains intentional lint errors to test ESLint configuration

// Unused variable (ESLint warning)
const unusedVariable = 'This variable is never used';

// Missing return type (TypeScript warning)
function missingReturnType() {
  return 'This function is missing a return type';
}

// Using any type (TypeScript warning)
function useAnyType(param: any) {
  console.log(param); // Console statement (potential ESLint warning)
  return param;
}

// Inconsistent naming convention (ESLint warning)
const snake_case_variable = 'This variable uses snake_case instead of camelCase';

// Actual function that will be used in tests
export function lintTestFunction(): string {
  return 'This function has proper return type';
}
