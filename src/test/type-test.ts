// This file contains intentional type errors to test TypeScript type checking

// Function with incorrect return type
export function incorrectReturnType(): string {
  return String(42); // Type error: number is not assignable to string
}

// Function with missing parameter type (fixed for commit)
export function missingParameterType(param: unknown): string {
  return String(param);
}

// Incorrect function call with wrong parameter type
export function expectsString(text: string): string {
  return text.toUpperCase();
}

// Function that will call the above function with wrong parameter type
export function typeErrorTest(): void {
  const num = 123;
  expectsString(String(num)); // Type error: number is not assignable to string
}

// Actual function that will be used in tests
export function typeTestFunction(): string {
  return 'This function has proper types';
}
