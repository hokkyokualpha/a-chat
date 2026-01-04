"use client";

import { useState, KeyboardEvent, useRef } from "react";
import styles from "./MessageInput.module.css";
import { validateImageFile, fileToBase64 } from "@/lib/imageValidation";

interface MessageInputProps {
  onSendMessage: (message: string, imageData?: string) => void;
  disabled?: boolean;
}

export default function MessageInput({
  onSendMessage,
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);

    // Validate image
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setImageError(validation.error || "Invalid image");
      return;
    }

    try {
      // Convert to base64
      const base64 = await fileToBase64(file);
      setImagePreview(base64);
    } catch (error) {
      setImageError("Failed to load image");
      console.error("Error loading image:", error);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || imagePreview) && !disabled) {
      onSendMessage(message.trim() || "画像を送信しました", imagePreview || undefined);
      setMessage("");
      setImagePreview(null);
      setImageError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className={styles.messageInput} onSubmit={handleSubmit}>
      {imagePreview && (
        <div className={styles.imagePreview}>
          <img src={imagePreview} alt="Preview" />
          <button
            type="button"
            onClick={handleRemoveImage}
            className={styles.removeImageButton}
            aria-label="画像を削除"
          >
            ×
          </button>
        </div>
      )}
      {imageError && (
        <div className={styles.imageError}>
          {imageError}
        </div>
      )}
      <div className={styles.inputContainer}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleImageSelect}
          className={styles.fileInput}
          id="image-upload"
          disabled={disabled}
        />
        <label
          htmlFor="image-upload"
          className={styles.imageButton}
          aria-label="画像を添付"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={styles.imageIcon}
          >
            <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
          </svg>
        </label>
        <textarea
          className={styles.textarea}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力... (Shift+Enterで改行)"
          disabled={disabled}
          rows={1}
          maxLength={4000}
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={(!message.trim() && !imagePreview) || disabled}
          aria-label="送信"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={styles.sendIcon}
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </div>
      <div className={styles.hint}>
        {message.length > 0 && (
          <span className={styles.charCount}>
            {message.length} / 4000
          </span>
        )}
      </div>
    </form>
  );
}
