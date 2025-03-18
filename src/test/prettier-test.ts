// This file contains intentional formatting issues to test Prettier configuration

// Too long line that exceeds printWidth
const veryLongString =
  'This is an extremely long string that definitely exceeds the printWidth setting in our Prettier configuration and should trigger a formatting warning';

// Inconsistent quote usage (single vs double)
const singleQuote = 'This string uses single quotes';
const doubleQuote = 'This string uses double quotes';

// Inconsistent spacing
function inconsistentSpacing(param1: string, param2: number) {
  return param1 + param2;
}

// Inconsistent indentation
function inconsistentIndentation() {
  const level1 = true;
  const level2 = false;
  const level3 = null;
  return {
    level1,
    level2,
    level3,
  };
}

// Actual function that will be used in tests
export function prettierTestFunction(): string {
  return 'This function has proper formatting';
}
