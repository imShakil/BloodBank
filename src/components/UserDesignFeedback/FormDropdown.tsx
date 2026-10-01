import React from 'react';
import styles from './DesignFeedback.module.css';

interface DropdownOption {
  value: string;
  label: string;
}

interface FormDropdownProps {
  label: string;
  name: string;
  options: DropdownOption[];
  value: string;
  onChange: (name: string, value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

export const FormDropdown: React.FC<FormDropdownProps> = ({
  label,
  name,
  options,
  value,
  onChange,
  error,
  required = false,
  placeholder = 'Select an option',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(name, e.target.value);
  };

  return (
    <div className={styles.formGroup}>
      <label htmlFor={name} className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        className={`${styles.select} ${error ? styles.inputError : ''}`}
        aria-describedby={error ? `${name}-error` : undefined}
        aria-invalid={!!error}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${name}-error`} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
};
