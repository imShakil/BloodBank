# Design Feedback Component

## Overview

The Design Feedback component provides a user-friendly form for collecting design-related feedback from users. It includes comprehensive validation, accessibility support, responsive design, and real-time error display.

## Features

- ✅ **Responsive Design**: Works on mobile, tablet, and desktop devices
- ✅ **Real-time Validation**: Validates input as users type
- ✅ **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation and screen reader support
- ✅ **Type-Safe**: Fully typed with TypeScript
- ✅ **Error Handling**: Clear error messages near form fields
- ✅ **Success Feedback**: Auto-dismissing success message with fade animation
- ✅ **Dark Mode**: Supports dark mode preference
- ✅ **Form Reset**: Clears form after successful submission

## Installation

```bash
import { DesignFeedbackForm } from '@/components/UserDesignFeedback';
```

## Usage

### Basic Usage

```tsx
import { DesignFeedbackPage } from '@/pages/DesignFeedback/DesignFeedbackPage';

// In your routing configuration
<Route path="/feedback" element={<DesignFeedbackPage />} />
```

### Standalone Form

```tsx
import { DesignFeedbackForm } from '@/components/UserDesignFeedback';

export const MyPage = () => {
  return (
    <div>
      <h1>Send Us Your Feedback</h1>
      <DesignFeedbackForm />
    </div>
  );
};
```

### Custom Styling

The component uses CSS Modules (`DesignFeedback.module.css`). To customize:

1. Override CSS classes in your own stylesheet:

```css
.submitButton {
  background-color: var(--primary-color);
}
```

2. Or modify `DesignFeedback.module.css` directly

## Form Fields

| Field | Type | Rules | Required |
|-------|------|-------|----------|
| First Name | Text | 2-50 chars, alphabetic only | Yes |
| Last Name | Text | 2-50 chars, alphabetic only | Yes |
| Email | Email | Valid email format | Yes |
| Feedback Category | Dropdown | 6 categories | Yes |
| Design Feedback | Textarea | 10-1000 characters | Yes |

### Feedback Categories

- UI Design
- User Experience (UX)
- Accessibility
- Navigation
- Visual Issues
- Suggestions

## Validation Rules

All validations happen in real-time as users type:

```typescript
// First Name
- Required
- Minimum 2 characters
- Maximum 50 characters
- Alphabetic only

// Last Name
- Required
- Minimum 2 characters
- Maximum 50 characters
- Alphabetic only

// Email
- Required
- Valid email format (test@example.com)

// Feedback Category
- Required (must select one)

// Design Feedback
- Required
- Minimum 10 characters
- Maximum 1000 characters
```

## Component Structure

```
DesignFeedbackPage
  └── DesignFeedbackForm
      ├── FormInput (First Name)
      ├── FormInput (Last Name)
      ├── FormInput (Email)
      ├── FormDropdown (Category)
      ├── FormTextArea (Feedback)
      ├── SuccessMessage
      └── Submit Button
```

## Custom Hook: useFeedbackForm

The form uses a custom React hook for state management:

```tsx
const {
  formData,           // Current form values
  errors,             // Validation errors
  isSubmitting,       // Submission in progress
  isSuccess,          // Submission successful
  successMessage,     // Success message text
  handleInputChange,  // Handle input changes
  handleSubmit,       // Handle form submission
  resetForm,          // Reset form to initial state
  setSuccessMessage,  // Set custom success message
} = useFeedbackForm();
```

## Validation Service

Validation logic is isolated in `validationService.ts`:

```typescript
import { validationService } from '@/services/validationService';

// Validate single field
const result = validationService.validateFirstName('John');
// { isValid: true }

// Validate entire form
const errors = validationService.validateForm(formData);
// { firstName?: 'error', lastName?: 'error', ... }
```

## Accessibility

### Keyboard Navigation
- Tab: Move to next field
- Shift+Tab: Move to previous field
- Enter: Submit form
- Arrow keys: Navigate dropdown options

### Screen Reader Support
- All inputs have associated labels
- Error messages are linked with `aria-describedby`
- Success message uses `role="alert"` for announcements
- ARIA invalid/required attributes on form fields

### WCAG Compliance
- ✅ Color contrast ratio ≥ 4.5:1
- ✅ Focus indicators on all interactive elements
- ✅ Semantic HTML structure
- ✅ Support for prefers-reduced-motion
- ✅ Support for prefers-contrast
- ✅ Dark mode support via prefers-color-scheme

## Testing

### Unit Tests
```bash
npm test src/utils/validators.test.ts
npm test src/services/validationService.test.ts
npm test src/hooks/useFeedbackForm.test.ts
```

### Component Tests
```bash
npm test src/components/UserDesignFeedback/FormInput.test.tsx
npm test src/components/UserDesignFeedback/DesignFeedbackForm.test.tsx
```

### E2E Tests
```bash
npm run cypress:open
# Select: cypress/e2e/design-feedback.cy.ts
```

## API Integration

Currently, the form does not submit to an API (out of scope). To add API integration in the future:

1. Modify `useFeedbackForm.ts` `handleSubmit` function
2. Make an async API call to your endpoint
3. Handle success/error states

Example:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const fieldErrors = validationService.validateForm(formData);
  if (Object.keys(fieldErrors).length > 0) {
    setErrors(fieldErrors);
    return;
  }

  setIsSubmitting(true);
  
  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    
    if (!response.ok) throw new Error('Submission failed');
    
    setIsSuccess(true);
    resetForm();
  } catch (error) {
    setErrors({ submit: 'Failed to submit feedback' });
  } finally {
    setIsSubmitting(false);
  }
};
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **Bundle Size**: ~15 KB (minified + gzipped)
- **No External Dependencies**: Uses only React
- **Re-render Optimization**: Uses useCallback for handlers
- **CSS Modules**: Scoped styles, no global pollution

## Styling Customization

### CSS Variables

Add custom CSS variables to your app:

```css
:root {
  --primary-color: #3b82f6;
  --error-color: #e74c3c;
  --success-color: #27ae60;
  --text-color: #1a1a1a;
  --border-color: #e0e0e0;
}
```

### Theme Colors

The component responds to `prefers-color-scheme` for automatic dark mode support.

## Troubleshooting

### Success Message Not Showing

Make sure the form data passes validation. Check browser console for validation errors.

### Form Not Clearing

The form clears automatically after successful submission. If not clearing:
1. Check that `resetForm()` is being called
2. Verify form validation passes

### Accessibility Issues

Run axe DevTools or similar a11y checker to verify compliance.

## Contributing

When modifying this component:

1. Update tests to match changes
2. Run test suite: `npm test`
3. Run E2E tests: `npm run cypress:open`
4. Update this README with new features/changes

## Related Files

- `types/feedback.ts` - Type definitions
- `hooks/useFeedbackForm.ts` - Form state hook
- `services/validationService.ts` - Validation logic
- `utils/validators.ts` - Validator functions
- `DesignFeedback.module.css` - Styling
