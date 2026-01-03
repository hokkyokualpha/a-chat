"use client";

import { useEffect, useRef } from "react";
import Message, { MessageProps } from "./Message";
import TypingIndicator from "./TypingIndicator";
import styles from "./MessageList.module.css";

interface MessageListProps {
  messages: MessageProps[];
  isTyping?: boolean;
}

export default function MessageList({
  messages,
  isTyping = false,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className={styles.messageList}>
      {messages.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💬</div>
          <h2 className={styles.emptyTitle}>会話を始めましょう</h2>
          <p className={styles.emptyText}>
            下のメッセージ欄から、AIとの会話を開始できます。
          </p>
        </div>
      )}

      {messages.map((message, index) => (
        <Message
          key={index}
          role={message.role}
          content={message.content}
          timestamp={message.timestamp}
        />
      ))}

      {isTyping && <TypingIndicator />}

      <div ref={messagesEndRef} />
    </div>
  );
}
