import { useState, useCallback, useEffect } from 'react';
import { IFeedbackForm, IFormError, FeedbackCategory } from '../types/feedback';
import { validationService } from '../services/validationService';

const initialFormState: IFeedbackForm = {
  firstName: '',
  lastName: '',
  email: '',
  feedbackCategory: '',
  feedbackComment: '',
};

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

  const handleInputChange = useCallback(
    (name: string, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Clear error message when user starts editing
      if (isError) {
        setIsError(false);
        setErrorMessage(null);
      }

      // Real-time validation
      const updatedFormData = {
        ...formData,
        [name]: value,
      };

      const fieldErrors = validationService.validateForm(updatedFormData);
      setErrors(fieldErrors);
    },
    [formData, isError],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Validate entire form
      const fieldErrors = validationService.validateForm(formData);

      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        return;
      }

      // Clear any previous errors
      setIsError(false);
      setErrorMessage(null);

      // All validations passed
      setIsSubmitting(true);
      setLastSubmittedData(formData);

      // Simulate async operation (for future API integration)
      setTimeout(() => {
        try {
          // API call would go here - currently simulated
          // Example: await submitFeedback(formData);

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

          const message = error instanceof Error
            ? error.message
            : 'Failed to submit feedback. Please try again.';
          setErrorMessage(message);
        }
      }, 300);
    },
    [formData],
  );

  const retry = useCallback(() => {
    if (lastSubmittedData) {
      setFormData(lastSubmittedData);
      handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>);
    }
  }, [lastSubmittedData, handleSubmit]);

  const clearError = useCallback(() => {
    setIsError(false);
    setErrorMessage(null);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormState);
    setErrors({});
    setIsSubmitting(false);
    setIsError(false);
    setErrorMessage(null);
    setLastSubmittedData(null);
  }, []);

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
