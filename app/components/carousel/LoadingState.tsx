import React from 'react';
import styles from './LoadingState.module.css';

const LoadingState: React.FC = () => {
    return (
        <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading photos...</p>
        </div>
    );
};

export default LoadingState;
