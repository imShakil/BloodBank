import { IValidationError, IFeedbackForm, FeedbackCategory } from '../types/feedback';
import {
  isEmpty,
  isAlphabeticOnly,
  isLengthValid,
  isValidEmail,
} from '../utils/validators';

export const validationService = {
  validateFirstName(value: string): IValidationError {
    if (isEmpty(value)) {
      return { isValid: false, error: 'First name is required' };
    }
    if (!isLengthValid(value, 2, 50)) {
      return { isValid: false, error: 'First name must be 2-50 characters' };
    }
    if (!isAlphabeticOnly(value)) {
      return { isValid: false, error: 'First name must contain only letters' };
    }
    return { isValid: true };
  },

  validateLastName(value: string): IValidationError {
    if (isEmpty(value)) {
      return { isValid: false, error: 'Last name is required' };
    }
    if (!isLengthValid(value, 2, 50)) {
      return { isValid: false, error: 'Last name must be 2-50 characters' };
    }
    if (!isAlphabeticOnly(value)) {
      return { isValid: false, error: 'Last name must contain only letters' };
    }
    return { isValid: true };
  },

  validateEmail(value: string): IValidationError {
    if (isEmpty(value)) {
      return { isValid: false, error: 'Email is required' };
    }
    if (!isValidEmail(value)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true };
  },

  validateFeedbackCategory(value: string): IValidationError {
    if (isEmpty(value)) {
      return { isValid: false, error: 'Please select a feedback category' };
    }
    const validCategories = Object.values(FeedbackCategory);
    if (!validCategories.includes(value as FeedbackCategory)) {
      return { isValid: false, error: 'Invalid feedback category' };
    }
    return { isValid: true };
  },

  validateFeedbackComment(value: string): IValidationError {
    if (isEmpty(value)) {
      return { isValid: false, error: 'Feedback comment is required' };
    }
    if (!isLengthValid(value, 10, 1000)) {
      return {
        isValid: false,
        error: 'Feedback must be 10-1000 characters',
      };
    }
    return { isValid: true };
  },

  validateForm(formData: IFeedbackForm): Record<string, string> {
    const errors: Record<string, string> = {};

    const firstNameValidation = this.validateFirstName(formData.firstName);
    if (!firstNameValidation.isValid) {
      errors.firstName = firstNameValidation.error || '';
    }

    const lastNameValidation = this.validateLastName(formData.lastName);
    if (!lastNameValidation.isValid) {
      errors.lastName = lastNameValidation.error || '';
    }

    const emailValidation = this.validateEmail(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error || '';
    }

    const categoryValidation = this.validateFeedbackCategory(
      formData.feedbackCategory,
    );
    if (!categoryValidation.isValid) {
      errors.feedbackCategory = categoryValidation.error || '';
    }

    const commentValidation = this.validateFeedbackComment(
      formData.feedbackComment,
    );
    if (!commentValidation.isValid) {
      errors.feedbackComment = commentValidation.error || '';
    }

    return errors;
  },
};
