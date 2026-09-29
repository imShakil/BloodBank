import React from 'react';
import { DesignFeedbackForm } from '../../components/UserDesignFeedback/DesignFeedbackForm';
import styles from '../../components/UserDesignFeedback/DesignFeedback.module.css';

export const DesignFeedbackPage: React.FC = () => {
  return (
    <div className={styles.page}>
      <div className={styles.pageContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Design Feedback</h1>
          <p className={styles.pageSubtitle}>
            We value your design feedback
          </p>
        </div>

        <DesignFeedbackForm />
      </div>
    </div>
  );
};
