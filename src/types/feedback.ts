export enum FeedbackCategory {
  UI_DESIGN = 'UI_DESIGN',
  UX = 'UX',
  ACCESSIBILITY = 'ACCESSIBILITY',
  NAVIGATION = 'NAVIGATION',
  VISUAL_ISSUES = 'VISUAL_ISSUES',
  SUGGESTIONS = 'SUGGESTIONS',
}

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  [FeedbackCategory.UI_DESIGN]: 'UI Design',
  [FeedbackCategory.UX]: 'User Experience',
  [FeedbackCategory.ACCESSIBILITY]: 'Accessibility',
  [FeedbackCategory.NAVIGATION]: 'Navigation',
  [FeedbackCategory.VISUAL_ISSUES]: 'Visual Issues',
  [FeedbackCategory.SUGGESTIONS]: 'Suggestions',
};

export interface IFeedbackForm {
  firstName: string;
  lastName: string;
  email: string;
  feedbackCategory: FeedbackCategory | '';
  feedbackComment: string;
}

export interface IValidationError {
  isValid: boolean;
  error?: string;
}

export interface IFormError {
  firstName?: string;
  lastName?: string;
  email?: string;
  feedbackCategory?: string;
  feedbackComment?: string;
}

export interface IFeedbackFormState {
  formData: IFeedbackForm;
  errors: IFormError;
  isSubmitting: boolean;
  isSuccess: boolean;
  successMessage: string;
}

export interface IFeedbackFormHandlers {
  handleInputChange: (name: string, value: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  resetForm: () => void;
  setSuccessMessage: (message: string) => void;
}

export interface IFeedbackFormHook extends IFeedbackFormState, IFeedbackFormHandlers {}
