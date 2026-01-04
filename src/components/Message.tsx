"use client";

import styles from "./Message.module.css";

export interface MessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  imageData?: string;
}

export default function Message({ role, content, timestamp, imageData }: MessageProps) {
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
        {imageData && (
          <div className={styles.messageImage}>
            <img src={imageData} alt="Attached image" />
          </div>
        )}
        <div className={styles.messageText}>{content}</div>
      </div>
    </div>
  );
}
