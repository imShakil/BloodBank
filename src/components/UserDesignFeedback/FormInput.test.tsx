import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormInput } from './FormInput';

describe('FormInput Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('should render input with label', () => {
    render(
      <FormInput
        label="First Name"
        name="firstName"
        value=""
        onChange={mockOnChange}
      />,
    );

    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
  });

  it('should render required indicator', () => {
    render(
      <FormInput
        label="First Name"
        name="firstName"
        value=""
        onChange={mockOnChange}
        required
      />,
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should display placeholder text', () => {
    render(
      <FormInput
        label="Email"
        name="email"
        type="email"
        value=""
        onChange={mockOnChange}
        placeholder="Enter your email"
      />,
    );

    const input = screen.getByPlaceholderText('Enter your email');
    expect(input).toBeInTheDocument();
  });

  it('should call onChange when input value changes', () => {
    const { container } = render(
      <FormInput
        label="First Name"
        name="firstName"
        value=""
        onChange={mockOnChange}
      />,
    );

    const input = container.querySelector('input');
    fireEvent.change(input!, { target: { value: 'John' } });

    expect(mockOnChange).toHaveBeenCalledWith('firstName', 'John');
  });

  it('should display error message', () => {
    render(
      <FormInput
        label="First Name"
        name="firstName"
        value=""
        onChange={mockOnChange}
        error="First name is required"
      />,
    );

    expect(screen.getByText('First name is required')).toBeInTheDocument();
  });

  it('should have aria-invalid when error exists', () => {
    const { container } = render(
      <FormInput
        label="First Name"
        name="firstName"
        value=""
        onChange={mockOnChange}
        error="Error message"
      />,
    );

    const input = container.querySelector('input');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('should have aria-describedby when error exists', () => {
    const { container } = render(
      <FormInput
        label="First Name"
        name="firstName"
        value=""
        onChange={mockOnChange}
        error="Error message"
      />,
    );

    const input = container.querySelector('input');
    expect(input).toHaveAttribute('aria-describedby', 'firstName-error');
  });

  it('should support different input types', () => {
    const { container } = render(
      <FormInput
        label="Email"
        name="email"
        type="email"
        value=""
        onChange={mockOnChange}
      />,
    );

    const input = container.querySelector('input');
    expect(input).toHaveAttribute('type', 'email');
  });
});
