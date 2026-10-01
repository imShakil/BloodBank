import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { IFeedbackForm, IFormError, FeedbackCategory } from '../types/feedback';
import { validationService } from '../services/validationService';
import { debounce } from '../utils/debounce';

const initialFormState: IFeedbackForm = {
  firstName: '',
  lastName: '',
  email: '',
  feedbackCategory: '',
  feedbackComment: '',
};

const VALIDATION_DEBOUNCE_DELAY = 300; // milliseconds

export interface IFeedbackFormHookResult {
  formData: IFeedbackForm;
  errors: IFormError;
  isSubmitting: boolean;
  isSuccess: boolean;
  isError: boolean;
  successMessage: string;
  errorMessage: string | null;
  handleInputChange: (name: string, value: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  resetForm: () => void;
  setSuccessMessage: (message: string) => void;
  retry: () => void;
  clearError: () => void;
}

export const useFeedbackForm = (): IFeedbackFormHookResult => {
  const [formData, setFormData] = useState<IFeedbackForm>(initialFormState);
  const [errors, setErrors] = useState<IFormError>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [successMessage, setSuccessMessageState] = useState(
    'Thank you for your feedback.',
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSubmittedData, setLastSubmittedData] = useState<IFeedbackForm | null>(null);

  // Ref to store the last form data for debounced validation
  const formDataRef = useRef<IFeedbackForm>(formData);

  // Update ref when form data changes
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Create debounced validation function (memoized)
  const debouncedValidate = useMemo(
    () =>
      debounce((dataToValidate: IFeedbackForm) => {
        const fieldErrors = validationService.validateForm(dataToValidate);
        setErrors(fieldErrors);
      }, VALIDATION_DEBOUNCE_DELAY),
    [],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedValidate.cancel();
    };
  }, [debouncedValidate]);

  // Optimized: Use functional setState to eliminate formData dependency
  const handleInputChange = useCallback(
    (name: string, value: string) => {
      setFormData((prev) => {
        const updated = { ...prev, [name]: value };

        // Trigger debounced validation with updated data
        debouncedValidate(updated);

        return updated;
      });

      // Clear error message when user starts editing
      if (isError) {
        setIsError(false);
        setErrorMessage(null);
      }
    },
    [isError, debouncedValidate],
  );

  // Optimized: Use functional setState to eliminate formData dependency
  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Cancel pending validation to use latest data
      debouncedValidate.cancel();

      // Validate entire form with current data
      const fieldErrors = validationService.validateForm(formDataRef.current);

      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        return;
      }

      // Clear any previous errors
      setIsError(false);
      setErrorMessage(null);

      // All validations passed
      setIsSubmitting(true);
      setLastSubmittedData(formDataRef.current);

      // Simulate async operation (for future API integration)
      setTimeout(() => {
        try {
          // API call would go here - currently simulated
          // Example: await submitFeedback(formDataRef.current);

          setIsSubmitting(false);
          setIsSuccess(true);

          // Auto-dismiss success message after 3-5 seconds
          const duration = 4000;
          setTimeout(() => {
            setIsSuccess(false);
            resetForm();
          }, duration);
        } catch (error) {
          setIsSubmitting(false);
          setIsError(true);

          const message =
            error instanceof Error
              ? error.message
              : 'Failed to submit feedback. Please try again.';
          setErrorMessage(message);
        }
      }, 300);
    },
    [debouncedValidate],
  );

  const retry = useCallback(() => {
    if (lastSubmittedData) {
      setFormData(lastSubmittedData);

      // Cancel pending validations
      debouncedValidate.cancel();

      // Trigger immediate submission
      setTimeout(() => {
        setIsSubmitting(true);

        setTimeout(() => {
          try {
            setIsSubmitting(false);
            setIsSuccess(true);

            setTimeout(() => {
              setIsSuccess(false);
              resetForm();
            }, 4000);
          } catch (error) {
            setIsSubmitting(false);
            setIsError(true);
            const message =
              error instanceof Error
                ? error.message
                : 'Failed to submit feedback. Please try again.';
            setErrorMessage(message);
          }
        }, 300);
      }, 0);
    }
  }, [lastSubmittedData, debouncedValidate]);

  const clearError = useCallback(() => {
    setIsError(false);
    setErrorMessage(null);
  }, []);

  const resetForm = useCallback(() => {
    debouncedValidate.cancel();
    setFormData(initialFormState);
    setErrors({});
    setIsSubmitting(false);
    setIsError(false);
    setErrorMessage(null);
    setLastSubmittedData(null);
  }, [debouncedValidate]);

  const setSuccessMessage = useCallback((message: string) => {
    setSuccessMessageState(message);
  }, []);

  return {
    formData,
    errors,
    isSubmitting,
    isSuccess,
    isError,
    successMessage,
    errorMessage,
    handleInputChange,
    handleSubmit,
    resetForm,
    setSuccessMessage,
    retry,
    clearError,
  };
};
