"use client";

import { useState, useEffect } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { MessageProps } from "./Message";
import styles from "./ChatContainer.module.css";

export default function ChatContainer() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create session on mount
  useEffect(() => {
    createSession();
  }, []);

  const createSession = async () => {
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      const data = await response.json();
      setSessionId(data.sessionId);
    } catch (err) {
      console.error("Error creating session:", err);
      setError("セッションの作成に失敗しました。ページを再読み込みしてください。");
    }
  };

  const sendMessage = async (content: string) => {
    if (!sessionId) {
      setError("セッションが作成されていません。");
      return;
    }

    // Add user message to UI immediately
    const userMessage: MessageProps = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          message: content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      const data = await response.json();

      // Add assistant message to UI
      const assistantMessage: MessageProps = {
        role: "assistant",
        content: data.response,
        timestamp: data.timestamp,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Error sending message:", err);
      setError(
        err instanceof Error
          ? err.message
          : "メッセージの送信に失敗しました。もう一度お試しください。"
      );

      // Remove the user message if sending failed
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>A-Chat</h1>
        <p className={styles.subtitle}>AI-powered conversation</p>
      </header>

      {error && (
        <div className={styles.errorBanner}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>{error}</span>
          <button
            className={styles.errorClose}
            onClick={() => setError(null)}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
      )}

      <MessageList messages={messages} isTyping={isLoading} />

      <MessageInput onSendMessage={sendMessage} disabled={isLoading || !sessionId} />
    </div>
  );
}
