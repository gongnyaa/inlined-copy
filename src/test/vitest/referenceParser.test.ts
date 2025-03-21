import { describe, test, expect } from 'vitest';
import { parseReference, ReferenceType } from '../../referenceParser';

describe('Reference Parser', () => {
  test('should parse file-only references correctly', () => {
    const reference = parseReference('![[document.md]]');
    expect(reference.type).toBe(ReferenceType.fileOnly);
    expect(reference.filePath).toBe('document.md');
    expect(reference.headingPath).toBeUndefined();
    expect(reference.customId).toBeUndefined();
    expect(reference.originalReference).toBe('![[document.md]]');
  });

  test('should parse single heading references correctly', () => {
    const reference = parseReference('![[document.md#Introduction]]');
    expect(reference.type).toBe(ReferenceType.singleHeading);
    expect(reference.filePath).toBe('document.md');
    expect(reference.headingPath).toEqual(['Introduction']);
    expect(reference.customId).toBeUndefined();
    expect(reference.originalReference).toBe('![[document.md#Introduction]]');
  });

  test('should parse nested heading references correctly', () => {
    const reference = parseReference('![[document.md#Chapter 1#Section 1.1]]');
    expect(reference.type).toBe(ReferenceType.nestedHeading);
    expect(reference.filePath).toBe('document.md');
    expect(reference.headingPath).toEqual(['Chapter 1', 'Section 1.1']);
    expect(reference.customId).toBeUndefined();
    expect(reference.originalReference).toBe('![[document.md#Chapter 1#Section 1.1]]');
  });

  test('should handle whitespace in references', () => {
    const reference = parseReference('![[ document with spaces.md # Heading with spaces ]]');
    expect(reference.type).toBe(ReferenceType.singleHeading);
    expect(reference.filePath).toBe('document with spaces.md');
    expect(reference.headingPath).toEqual(['Heading with spaces']);
    expect(reference.originalReference).toBe(
      '![[ document with spaces.md # Heading with spaces ]]'
    );
  });

  test('should handle empty references', () => {
    const reference = parseReference('![[]]');
    expect(reference.type).toBe(ReferenceType.fileOnly);
    expect(reference.filePath).toBe('');
    expect(reference.originalReference).toBe('![[]]');
  });

  test('should handle references with multiple # characters', () => {
    const reference = parseReference('![[document.md#Heading with # character]]');
    expect(reference.type).toBe(ReferenceType.singleHeading);
    expect(reference.filePath).toBe('document.md');
    expect(reference.headingPath).toEqual(['Heading with # character']);
    expect(reference.originalReference).toBe('![[document.md#Heading with # character]]');
  });

  test('should handle references with multiple nested levels', () => {
    const reference = parseReference('![[document.md#Level 1#Level 2#Level 3#Level 4]]');
    expect(reference.type).toBe(ReferenceType.nestedHeading);
    expect(reference.filePath).toBe('document.md');
    expect(reference.headingPath).toEqual(['Level 1', 'Level 2', 'Level 3', 'Level 4']);
    expect(reference.originalReference).toBe('![[document.md#Level 1#Level 2#Level 3#Level 4]]');
  });

  test('should handle invalid reference format', () => {
    const reference = parseReference('This is not a reference');
    expect(reference.type).toBe(ReferenceType.fileOnly);
    expect(reference.filePath).toBe('');
    expect(reference.originalReference).toBe('This is not a reference');
  });
});
