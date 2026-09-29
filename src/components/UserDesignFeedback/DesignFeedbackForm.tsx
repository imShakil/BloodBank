import React from 'react';
import { useFeedbackForm } from '../../hooks/useFeedbackForm';
import { FEEDBACK_CATEGORY_LABELS, FeedbackCategory } from '../../types/feedback';
import { FormInput } from './FormInput';
import { FormDropdown } from './FormDropdown';
import { FormTextArea } from './FormTextArea';
import { SuccessMessage } from './SuccessMessage';
import styles from './DesignFeedback.module.css';

export const DesignFeedbackForm: React.FC = () => {
  const {
    formData,
    errors,
    isSubmitting,
    isSuccess,
    successMessage,
    handleInputChange,
    handleSubmit,
  } = useFeedbackForm();

  const categoryOptions = Object.entries(FEEDBACK_CATEGORY_LABELS).map(
    ([value, label]) => ({
      value,
      label,
    }),
  );

  return (
    <div className={styles.formContainer}>
      <SuccessMessage
        message={successMessage}
        visible={isSuccess}
        onClose={() => {}}
      />

      <form onSubmit={handleSubmit} className={styles.form}>
        <FormInput
          label="First Name"
          name="firstName"
          type="text"
          value={formData.firstName}
          onChange={handleInputChange}
          error={errors.firstName}
          placeholder="Enter your first name"
          required
        />

        <FormInput
          label="Last Name"
          name="lastName"
          type="text"
          value={formData.lastName}
          onChange={handleInputChange}
          error={errors.lastName}
          placeholder="Enter your last name"
          required
        />

        <FormInput
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email}
          placeholder="Enter your email"
          required
        />

        <FormDropdown
          label="Feedback Category"
          name="feedbackCategory"
          options={categoryOptions}
          value={formData.feedbackCategory}
          onChange={handleInputChange}
          error={errors.feedbackCategory}
          placeholder="Select a category"
          required
        />

        <FormTextArea
          label="Design Feedback"
          name="feedbackComment"
          value={formData.feedbackComment}
          onChange={handleInputChange}
          error={errors.feedbackComment}
          placeholder="Share your feedback about the design..."
          minLength={10}
          maxLength={1000}
          required
        />

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
};
