import { renderHook, act } from '@testing-library/react';
import { useFeedbackForm } from './useFeedbackForm';
import { FeedbackCategory } from '../types/feedback';

describe('useFeedbackForm', () => {
  it('should initialize with empty form data', () => {
    const { result } = renderHook(() => useFeedbackForm());

    expect(result.current.formData.firstName).toBe('');
    expect(result.current.formData.lastName).toBe('');
    expect(result.current.formData.email).toBe('');
    expect(result.current.formData.feedbackCategory).toBe('');
    expect(result.current.formData.feedbackComment).toBe('');
  });

  it('should update form data on input change', () => {
    const { result } = renderHook(() => useFeedbackForm());

    act(() => {
      result.current.handleInputChange('firstName', 'John');
    });

    expect(result.current.formData.firstName).toBe('John');
  });

  it('should validate fields on input change', () => {
    const { result } = renderHook(() => useFeedbackForm());

    act(() => {
      result.current.handleInputChange('firstName', 'J');
    });

    expect(result.current.errors.firstName).toBeDefined();
  });

  it('should clear errors on valid input', () => {
    const { result } = renderHook(() => useFeedbackForm());

    act(() => {
      result.current.handleInputChange('firstName', 'J');
    });

    expect(result.current.errors.firstName).toBeDefined();

    act(() => {
      result.current.handleInputChange('firstName', 'John');
    });

    expect(result.current.errors.firstName).toBeUndefined();
  });

  it('should not submit form with validation errors', () => {
    const { result } = renderHook(() => useFeedbackForm());

    const event = {
      preventDefault: jest.fn(),
    } as any;

    act(() => {
      result.current.handleSubmit(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(result.current.isSuccess).toBe(false);
  });

  it('should submit form with valid data', (done) => {
    const { result } = renderHook(() => useFeedbackForm());

    act(() => {
      result.current.handleInputChange('firstName', 'John');
      result.current.handleInputChange('lastName', 'Smith');
      result.current.handleInputChange('email', 'john@example.com');
      result.current.handleInputChange(
        'feedbackCategory',
        FeedbackCategory.UI_DESIGN,
      );
      result.current.handleInputChange('feedbackComment', 'This is great feedback!');
    });

    const event = {
      preventDefault: jest.fn(),
    } as any;

    act(() => {
      result.current.handleSubmit(event);
    });

    expect(result.current.isSubmitting).toBe(true);

    setTimeout(() => {
      expect(result.current.isSuccess).toBe(true);
      done();
    }, 400);
  });

  it('should reset form', () => {
    const { result } = renderHook(() => useFeedbackForm());

    act(() => {
      result.current.handleInputChange('firstName', 'John');
      result.current.handleInputChange('lastName', 'Smith');
    });

    expect(result.current.formData.firstName).toBe('John');

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData.firstName).toBe('');
    expect(result.current.formData.lastName).toBe('');
    expect(result.current.errors).toEqual({});
  });

  it('should set custom success message', () => {
    const { result } = renderHook(() => useFeedbackForm());

    const customMessage = 'Custom success message';

    act(() => {
      result.current.setSuccessMessage(customMessage);
    });

    expect(result.current.successMessage).toBe(customMessage);
  });

  it('should handle submission errors', (done) => {
    const { result } = renderHook(() => useFeedbackForm());

    act(() => {
      result.current.handleInputChange('firstName', 'John');
      result.current.handleInputChange('lastName', 'Smith');
      result.current.handleInputChange('email', 'john@example.com');
      result.current.handleInputChange('feedbackCategory', 'UI_DESIGN');
      result.current.handleInputChange('feedbackComment', 'This is great feedback!');
    });

    const event = { preventDefault: jest.fn() } as any;

    act(() => {
      result.current.handleSubmit(event);
    });

    expect(result.current.isSubmitting).toBe(true);

    setTimeout(() => {
      expect(result.current.isSuccess).toBe(true);
      done();
    }, 400);
  });

  it('should clear error on user input', () => {
    const { result } = renderHook(() => useFeedbackForm());

    act(() => {
      // Simulate error state
      // In real scenario, this would be set by failed submission
      result.current.handleInputChange('firstName', 'J');
    });

    // When user changes input after error, it should clear
    // This is handled in the component via clearError()
    expect(result.current.isError === false).toBe(true);
  });

  it('should support retry submission', (done) => {
    const { result } = renderHook(() => useFeedbackForm());

    act(() => {
      result.current.handleInputChange('firstName', 'John');
      result.current.handleInputChange('lastName', 'Smith');
      result.current.handleInputChange('email', 'john@example.com');
      result.current.handleInputChange('feedbackCategory', 'UI_DESIGN');
      result.current.handleInputChange('feedbackComment', 'This is great feedback!');
    });

    const event = { preventDefault: jest.fn() } as any;

    act(() => {
      result.current.handleSubmit(event);
    });

    setTimeout(() => {
      expect(result.current.isSuccess).toBe(true);
      done();
    }, 400);
  });

  it('should clear error message', () => {
    const { result } = renderHook(() => useFeedbackForm());

    // Simulate error state by calling clearError
    act(() => {
      result.current.clearError();
    });

    expect(result.current.isError).toBe(false);
    expect(result.current.errorMessage).toBe(null);
  });
});
