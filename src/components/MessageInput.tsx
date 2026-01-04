"use client";

import { useState, KeyboardEvent, useRef } from "react";
import styles from "./MessageInput.module.css";

interface MessageInputProps {
  onSendMessage: (message: string, images?: string[]) => void;
  disabled?: boolean;
}

export default function MessageInput({
  onSendMessage,
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || images.length > 0) && !disabled) {
      onSendMessage(message.trim(), images.length > 0 ? images : undefined);
      setMessage("");
      setImages([]);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: string[] = [];
    const maxFiles = 4; // Limit to 4 images
    const maxSize = 5 * 1024 * 1024; // 5MB per file

    Array.from(files).slice(0, maxFiles).forEach((file) => {
      if (file.size > maxSize) {
        alert(`ファイル ${file.name} は5MB以下である必要があります。`);
        return;
      }

      if (!file.type.startsWith("image/")) {
        alert(`ファイル ${file.name} は画像ファイルである必要があります。`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === "string") {
          newImages.push(result);
          if (newImages.length === Math.min(files.length, maxFiles)) {
            setImages((prev) => [...prev, ...newImages]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form className={styles.messageInput} onSubmit={handleSubmit}>
      {images.length > 0 && (
        <div className={styles.imagePreviewContainer}>
          {images.map((image, index) => (
            <div key={index} className={styles.imagePreview}>
              <img src={image} alt={`Preview ${index + 1}`} />
              <button
                type="button"
                className={styles.removeImageButton}
                onClick={() => removeImage(index)}
                aria-label="画像を削除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className={styles.inputContainer}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className={styles.fileInput}
          id="image-upload"
          disabled={disabled || images.length >= 4}
        />
        <label htmlFor="image-upload" className={styles.uploadButton} title="画像を添付">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.uploadIcon}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
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
          disabled={(!message.trim() && images.length === 0) || disabled}
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
        {images.length > 0 && (
          <span className={styles.imageCount}>
            {images.length} 枚の画像
          </span>
        )}
      </div>
    </form>
  );
}
