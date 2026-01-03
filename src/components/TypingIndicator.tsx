"use client";

import styles from "./TypingIndicator.module.css";

export default function TypingIndicator() {
  return (
    <div className={styles.typingIndicator}>
      <div className={styles.typingContent}>
        <span className={styles.typingRole}>AI</span>
        <div className={styles.typingDots}>
          <span className={styles.dot}></span>
          <span className={styles.dot}></span>
          <span className={styles.dot}></span>
        </div>
      </div>
    </div>
  );
}
