// This file contains intentional formatting issues to test Prettier configuration

// Too long line that exceeds printWidth
const _veryLongString =
  'This is an extremely long string that definitely exceeds the printWidth setting in our Prettier configuration and should trigger a formatting warning';

// Inconsistent quote usage (single vs double)
const _singleQuote = 'This string uses single quotes';
const _doubleQuote = 'This string uses double quotes';

// Inconsistent spacing
function _inconsistentSpacing(param1: string, param2: number): string {
  return param1 + String(param2);
}

// Inconsistent indentation
function _inconsistentIndentation(): { level1: boolean; level2: boolean; level3: null } {
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
