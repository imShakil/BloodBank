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

export const useFeedbackForm = () => {
  const [formData, setFormData] = useState<IFeedbackForm>(initialFormState);
  const [errors, setErrors] = useState<IFormError>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessageState] = useState(
    'Thank you for your feedback.',
  );

  const handleInputChange = useCallback(
    (name: string, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Real-time validation
      const updatedFormData = {
        ...formData,
        [name]: value,
      };

      const fieldErrors = validationService.validateForm(updatedFormData);
      setErrors(fieldErrors);
    },
    [formData],
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

      // All validations passed
      setIsSubmitting(true);

      // Simulate async operation (for future API integration)
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(true);

        // Auto-dismiss success message after 3-5 seconds
        const duration = 4000;
        setTimeout(() => {
          setIsSuccess(false);
          resetForm();
        }, duration);
      }, 300);
    },
    [formData],
  );

  const resetForm = useCallback(() => {
    setFormData(initialFormState);
    setErrors({});
    setIsSubmitting(false);
  }, []);

  const setSuccessMessage = useCallback((message: string) => {
    setSuccessMessageState(message);
  }, []);

  return {
    formData,
    errors,
    isSubmitting,
    isSuccess,
    successMessage,
    handleInputChange,
    handleSubmit,
    resetForm,
    setSuccessMessage,
  };
};
