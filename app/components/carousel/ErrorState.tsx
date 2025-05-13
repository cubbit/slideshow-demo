import React from 'react';
import styles from './ErrorState.module.css';

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message = 'Unable to load photos', onRetry }) => {
    return (
        <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>!</div>
            <p>{message}</p>
            {onRetry && (
                <button className={styles.retryButton} onClick={onRetry}>
                    Try Again
                </button>
            )}
        </div>
    );
};

export default ErrorState;
