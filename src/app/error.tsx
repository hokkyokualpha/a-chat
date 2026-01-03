"use client";

import { useEffect } from "react";
import styles from "./error.module.css";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <div className={styles.errorIcon}>⚠️</div>
        <h1 className={styles.errorTitle}>エラーが発生しました</h1>
        <p className={styles.errorMessage}>
          申し訳ございません。予期しないエラーが発生しました。
        </p>
        {error.message && (
          <p className={styles.errorDetails}>{error.message}</p>
        )}
        <button className={styles.retryButton} onClick={() => reset()}>
          再試行
        </button>
      </div>
    </div>
  );
}
