import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DesignFeedbackForm } from './DesignFeedbackForm';

describe('DesignFeedbackForm Component', () => {
  it('should render all form fields', () => {
    render(<DesignFeedbackForm />);

    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Feedback Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Design Feedback/i)).toBeInTheDocument();
  });

  it('should render submit button', () => {
    render(<DesignFeedbackForm />);
    expect(screen.getByRole('button', { name: /Submit Feedback/i })).toBeInTheDocument();
  });

  it('should display validation errors on blur', async () => {
    render(<DesignFeedbackForm />);

    const firstNameInput = screen.getByPlaceholderText(
      'Enter your first name',
    ) as HTMLInputElement;

    fireEvent.change(firstNameInput, { target: { value: 'J' } });
    fireEvent.blur(firstNameInput);

    await waitFor(() => {
      expect(screen.getByText(/2-50 characters/i)).toBeInTheDocument();
    });
  });

  it('should not submit form with validation errors', async () => {
    render(<DesignFeedbackForm />);

    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });
    fireEvent.click(submitButton);

    expect(submitButton).not.toBeDisabled();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    render(<DesignFeedbackForm />);

    const firstNameInput = screen.getByPlaceholderText('Enter your first name');
    const lastNameInput = screen.getByPlaceholderText('Enter your last name');
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const categorySelect = screen.getByLabelText(/Feedback Category/i);
    const feedbackInput = screen.getByPlaceholderText(
      'Share your feedback about the design...',
    );
    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });

    await user.type(firstNameInput, 'John');
    await user.type(lastNameInput, 'Smith');
    await user.type(emailInput, 'john@example.com');
    await user.selectOption(categorySelect, 'UI_DESIGN');
    await user.type(feedbackInput, 'This is a great design!');

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Thank you for your feedback/i)).toBeInTheDocument();
    });
  });

  it('should clear form after successful submission', async () => {
    const user = userEvent.setup();
    render(<DesignFeedbackForm />);

    const firstNameInput = screen.getByPlaceholderText(
      'Enter your first name',
    ) as HTMLInputElement;
    const lastNameInput = screen.getByPlaceholderText(
      'Enter your last name',
    ) as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText(
      'Enter your email',
    ) as HTMLInputElement;
    const categorySelect = screen.getByLabelText(
      /Feedback Category/i,
    ) as HTMLSelectElement;
    const feedbackInput = screen.getByPlaceholderText(
      'Share your feedback about the design...',
    ) as HTMLTextAreaElement;
    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });

    await user.type(firstNameInput, 'John');
    await user.type(lastNameInput, 'Smith');
    await user.type(emailInput, 'john@example.com');
    await user.selectOption(categorySelect, 'UI_DESIGN');
    await user.type(feedbackInput, 'This is a great design!');

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(firstNameInput.value).toBe('');
      expect(lastNameInput.value).toBe('');
      expect(emailInput.value).toBe('');
      expect(categorySelect.value).toBe('');
      expect(feedbackInput.value).toBe('');
    });
  });

  it('should disable submit button while submitting', async () => {
    const user = userEvent.setup();
    render(<DesignFeedbackForm />);

    const firstNameInput = screen.getByPlaceholderText('Enter your first name');
    const lastNameInput = screen.getByPlaceholderText('Enter your last name');
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const categorySelect = screen.getByLabelText(/Feedback Category/i);
    const feedbackInput = screen.getByPlaceholderText(
      'Share your feedback about the design...',
    );
    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });

    await user.type(firstNameInput, 'John');
    await user.type(lastNameInput, 'Smith');
    await user.type(emailInput, 'john@example.com');
    await user.selectOption(categorySelect, 'UI_DESIGN');
    await user.type(feedbackInput, 'This is a great design!');

    fireEvent.click(submitButton);

    expect(submitButton).toHaveTextContent('Submitting...');
  });

  it('should reject invalid email format', async () => {
    const user = userEvent.setup();
    render(<DesignFeedbackForm />);

    const emailInput = screen.getByPlaceholderText('Enter your email');

    await user.type(emailInput, 'invalid-email');
    fireEvent.change(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    });
  });

  it('should validate category selection', async () => {
    const user = userEvent.setup();
    render(<DesignFeedbackForm />);

    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/select a feedback category/i)).toBeInTheDocument();
    });
  });
});
