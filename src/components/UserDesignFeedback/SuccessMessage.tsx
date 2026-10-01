import React, { useEffect } from 'react';
import styles from './DesignFeedback.module.css';

interface SuccessMessageProps {
  message: string;
  visible: boolean;
  duration?: number;
  onClose: () => void;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  visible,
  duration = 4000,
  onClose,
}) => {
  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <div
      className={`${styles.successMessage} ${visible ? styles.successMessageVisible : ''}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className={styles.successMessageContent}>
        <span className={styles.successIcon}>✓</span>
        <span className={styles.successText}>{message}</span>
      </div>
    </div>
  );
};
