import { validationService } from './validationService';
import { FeedbackCategory } from '../types/feedback';

describe('ValidationService', () => {
  describe('validateFirstName', () => {
    it('should accept valid first names', () => {
      const result = validationService.validateFirstName('John');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty names', () => {
      const result = validationService.validateFirstName('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject names shorter than 2 characters', () => {
      const result = validationService.validateFirstName('J');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('2-50');
    });

    it('should reject names longer than 50 characters', () => {
      const longName = 'A'.repeat(51);
      const result = validationService.validateFirstName(longName);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('2-50');
    });

    it('should reject names with numbers', () => {
      const result = validationService.validateFirstName('John123');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('letters');
    });
  });

  describe('validateLastName', () => {
    it('should accept valid last names', () => {
      const result = validationService.validateLastName('Smith');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty names', () => {
      const result = validationService.validateLastName('');
      expect(result.isValid).toBe(false);
    });

    it('should reject names with numbers or special characters', () => {
      const result = validationService.validateLastName('Smith@');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      const result = validationService.validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty emails', () => {
      const result = validationService.validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject invalid email formats', () => {
      const result = validationService.validateEmail('invalid.email');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('valid email');
    });
  });

  describe('validateFeedbackCategory', () => {
    it('should accept valid categories', () => {
      const result = validationService.validateFeedbackCategory(
        FeedbackCategory.UI_DESIGN,
      );
      expect(result.isValid).toBe(true);
    });

    it('should reject empty categories', () => {
      const result = validationService.validateFeedbackCategory('');
      expect(result.isValid).toBe(false);
    });

    it('should reject invalid categories', () => {
      const result = validationService.validateFeedbackCategory(
        'INVALID_CATEGORY',
      );
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateFeedbackComment', () => {
    it('should accept valid feedback', () => {
      const feedback = 'This is a valid feedback message with enough content.';
      const result = validationService.validateFeedbackComment(feedback);
      expect(result.isValid).toBe(true);
    });

    it('should reject empty feedback', () => {
      const result = validationService.validateFeedbackComment('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should reject feedback shorter than 10 characters', () => {
      const result = validationService.validateFeedbackComment('short');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('10-1000');
    });

    it('should reject feedback longer than 1000 characters', () => {
      const longFeedback = 'A'.repeat(1001);
      const result = validationService.validateFeedbackComment(longFeedback);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('10-1000');
    });
  });

  describe('validateForm', () => {
    it('should return empty object for valid form', () => {
      const validForm = {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        feedbackCategory: FeedbackCategory.UI_DESIGN,
        feedbackComment: 'This is a valid feedback message.',
      };
      const errors = validationService.validateForm(validForm);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('should return errors for invalid form', () => {
      const invalidForm = {
        firstName: '',
        lastName: '',
        email: 'invalid',
        feedbackCategory: '',
        feedbackComment: 'short',
      };
      const errors = validationService.validateForm(invalidForm);
      expect(Object.keys(errors).length).toBeGreaterThan(0);
      expect(errors.firstName).toBeDefined();
      expect(errors.lastName).toBeDefined();
      expect(errors.email).toBeDefined();
      expect(errors.feedbackCategory).toBeDefined();
      expect(errors.feedbackComment).toBeDefined();
    });
  });
});
