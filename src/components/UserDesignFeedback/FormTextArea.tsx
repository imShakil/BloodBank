import React from 'react';
import styles from './DesignFeedback.module.css';

interface FormTextAreaProps {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  error?: string;
  rows?: number;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}

export const FormTextArea: React.FC<FormTextAreaProps> = ({
  label,
  name,
  value,
  onChange,
  error,
  rows = 5,
  placeholder,
  minLength,
  maxLength,
  required = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(name, e.target.value);
  };

  const charCount = value.length;
  const charLimit = maxLength || 1000;

  return (
    <div className={styles.formGroup}>
      <label htmlFor={name} className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        minLength={minLength}
        maxLength={maxLength}
        className={`${styles.textarea} ${error ? styles.inputError : ''}`}
        aria-describedby={error ? `${name}-error` : `${name}-count`}
        aria-invalid={!!error}
      />
      <div className={styles.textAreaFooter}>
        <span id={`${name}-count`} className={styles.charCount}>
          {charCount} / {charLimit} characters
        </span>
      </div>
      {error && (
        <p id={`${name}-error`} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
};
