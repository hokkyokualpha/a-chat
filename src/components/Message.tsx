"use client";

import styles from "./Message.module.css";

export interface MessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  images?: string[];
}

export default function Message({ role, content, timestamp, images }: MessageProps) {
  const formattedTime = new Date(timestamp).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`${styles.message} ${styles[role]}`}>
      <div className={styles.messageContent}>
        <div className={styles.messageHeader}>
          <span className={styles.messageRole}>
            {role === "user" ? "あなた" : "AI"}
          </span>
          <span className={styles.messageTime}>{formattedTime}</span>
        </div>
        {images && images.length > 0 && (
          <div className={styles.messageImages}>
            {images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Uploaded image ${index + 1}`}
                className={styles.messageImage}
              />
            ))}
          </div>
        )}
        {content && <div className={styles.messageText}>{content}</div>}
      </div>
    </div>
  );
}
