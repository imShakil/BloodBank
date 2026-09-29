import {
  isAlphabeticOnly,
  isValidEmail,
  isLengthValid,
  isEmpty,
  hasMinLength,
  hasMaxLength,
} from './validators';

describe('Validators', () => {
  describe('isAlphabeticOnly', () => {
    it('should return true for valid alphabetic strings', () => {
      expect(isAlphabeticOnly('John')).toBe(true);
      expect(isAlphabeticOnly('Mary')).toBe(true);
      expect(isAlphabeticOnly("O'Brien")).toBe(true);
    });

    it('should return false for strings with numbers', () => {
      expect(isAlphabeticOnly('John123')).toBe(false);
      expect(isAlphabeticOnly('Test1')).toBe(false);
    });

    it('should return false for strings with special characters', () => {
      expect(isAlphabeticOnly('Test@')).toBe(false);
      expect(isAlphabeticOnly('Name#')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(isAlphabeticOnly('')).toBe(true);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('test+tag@example.com')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(isValidEmail('invalid.email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test @example.com')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isLengthValid', () => {
    it('should return true for strings within range', () => {
      expect(isLengthValid('hello', 2, 10)).toBe(true);
      expect(isLengthValid('test', 4, 4)).toBe(true);
    });

    it('should return false for strings below minimum', () => {
      expect(isLengthValid('hi', 5, 10)).toBe(false);
    });

    it('should return false for strings above maximum', () => {
      expect(isLengthValid('hello world', 2, 10)).toBe(false);
    });

    it('should trim whitespace', () => {
      expect(isLengthValid('  hello  ', 2, 10)).toBe(true);
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty strings', () => {
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
    });

    it('should return false for non-empty strings', () => {
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty(' text ')).toBe(false);
    });
  });

  describe('hasMinLength', () => {
    it('should return true for strings meeting minimum length', () => {
      expect(hasMinLength('hello', 5)).toBe(true);
      expect(hasMinLength('hello', 2)).toBe(true);
    });

    it('should return false for strings below minimum', () => {
      expect(hasMinLength('hi', 5)).toBe(false);
    });

    it('should trim whitespace', () => {
      expect(hasMinLength('  hello  ', 5)).toBe(true);
    });
  });

  describe('hasMaxLength', () => {
    it('should return true for strings within maximum length', () => {
      expect(hasMaxLength('hello', 10)).toBe(true);
      expect(hasMaxLength('hello', 5)).toBe(true);
    });

    it('should return false for strings exceeding maximum', () => {
      expect(hasMaxLength('hello', 4)).toBe(false);
    });

    it('should trim whitespace', () => {
      expect(hasMaxLength('  hello  ', 5)).toBe(true);
    });
  });
});
