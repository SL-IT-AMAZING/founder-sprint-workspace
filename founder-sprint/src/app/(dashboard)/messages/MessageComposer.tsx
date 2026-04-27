"use client";

/* eslint-disable @next/next/no-img-element -- composer previews use local blob URLs before upload. */

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { cleanupUploadedMessageImages } from "@/actions/messaging";
import type { MessageAttachmentInput } from "@/actions/messaging";
import { uploadMessageImages } from "@/lib/message-image-upload";
import {
  MESSAGE_IMAGE_ALLOWED_TYPES,
  MESSAGE_IMAGE_MAX_FILES,
  validateMessageImageFiles,
} from "@/lib/message-images";

interface SelectedImage {
  file: File;
  previewUrl: string;
}

interface MessageComposerProps {
  onSend: (
    content: string,
    attachments: MessageAttachmentInput[]
  ) => boolean | Promise<boolean>;
  disabled: boolean;
}

export default function MessageComposer({ onSend, disabled }: MessageComposerProps) {
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<SelectedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendingRef = useRef(false);
  const imagesRef = useRef<SelectedImage[]>([]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  const clearImages = () => {
    images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    const trimmed = message.trim();
    if ((!trimmed && images.length === 0) || disabled || sendingRef.current) return;

    sendingRef.current = true;
    setIsSending(true);
    setError(null);

    let uploadedAttachments: MessageAttachmentInput[] = [];

    try {
      if (images.length > 0) {
        const uploadResult = await uploadMessageImages(images.map((image) => image.file));
        if (!uploadResult.success) {
          setError(uploadResult.error);
          return;
        }
        uploadedAttachments = uploadResult.data;
      }

      const sent = await onSend(trimmed, uploadedAttachments);
      if (!sent) {
        if (uploadedAttachments.length > 0) {
          await cleanupUploadedMessageImages(
            uploadedAttachments.map((attachment) => attachment.storagePath)
          ).catch(() => {});
        }
        setError("Message could not be sent. Please try again.");
        return;
      }

      setMessage("");
      clearImages();

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-grow textarea (max 4 lines)
    const textarea = e.target;
    textarea.style.height = "auto";
    const lineHeight = 20; // approximate
    const maxHeight = lineHeight * 4;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  };

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    const validationError = validateMessageImageFiles(
      selectedFiles,
      images.length
    );
    if (validationError) {
      setError(validationError);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setError(null);
    setImages((current) => [
      ...current,
      ...selectedFiles.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((current) => {
      const removed = current[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const canSend = (message.trim().length > 0 || images.length > 0) && !disabled && !isSending;
  const canAttachMore = images.length < MESSAGE_IMAGE_MAX_FILES && !disabled && !isSending;

  return (
    <div
      style={{
        borderTop: "1px solid #e0e0e0",
        backgroundColor: "#FFFFFF",
        padding: "10px 16px 12px",
      }}
    >
      {images.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            padding: "0 0 10px",
          }}
        >
          {images.map((image, index) => (
            <div
              key={image.previewUrl}
              style={{
                position: "relative",
                width: "68px",
                height: "68px",
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid #e0e0e0",
                backgroundColor: "#f3f4f6",
                flex: "0 0 auto",
              }}
            >
              <img
                src={image.previewUrl}
                alt={`Selected image ${index + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                type="button"
                aria-label="Remove selected image"
                onClick={() => removeImage(index)}
                disabled={isSending}
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "rgba(0, 0, 0, 0.72)",
                  color: "#FFFFFF",
                  cursor: isSending ? "not-allowed" : "pointer",
                  lineHeight: 1,
                  fontSize: "14px",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ color: "#C62828", fontSize: "12px", marginBottom: "8px" }}>
          {error}
        </div>
      )}

      <div className="flex" style={{ alignItems: "flex-end", gap: "8px" }}>
        <input
          ref={fileInputRef}
          type="file"
          accept={MESSAGE_IMAGE_ALLOWED_TYPES.join(",")}
          multiple
          onChange={handleImageSelect}
          style={{ display: "none" }}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!canAttachMore}
          aria-label="Attach images"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "#f3f4f6",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: canAttachMore ? "pointer" : "not-allowed",
            opacity: canAttachMore ? 1 : 0.35,
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M3 13.2L6.8 9.4C7.2 9 7.9 9 8.3 9.4L10 11.1L10.8 10.3C11.2 9.9 11.9 9.9 12.3 10.3L15 13"
              stroke="#2F2C26"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="2.5" y="3" width="13" height="12" rx="2.5" stroke="#2F2C26" strokeWidth="1.5" />
            <circle cx="12.5" cy="6.5" r="1" fill="#2F2C26" />
          </svg>
        </button>

        {/* Input */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={images.length > 0 ? "Add a message..." : "Type a message..."}
          disabled={disabled || isSending}
          rows={1}
          style={{
            flex: 1,
            backgroundColor: "#f3f4f6",
            border: "none",
            borderRadius: "20px",
            padding: "10px 16px",
            fontSize: "14px",
            color: "#2F2C26",
            resize: "none",
            outline: "none",
            lineHeight: "20px",
            maxHeight: "80px",
            overflowY: "auto",
          }}
        />

        {/* Send Button */}
        <button
          onClick={() => {
            void handleSend();
          }}
          disabled={!canSend}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "#1A1A1A",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: canSend ? "pointer" : "not-allowed",
            opacity: canSend ? 1 : 0.3,
            flexShrink: 0,
            transition: "opacity 0.15s ease",
          }}
          aria-label="Send message"
        >
          {isSending ? (
            <div
              aria-hidden="true"
              style={{
                width: "14px",
                height: "14px",
                border: "2px solid rgba(255, 255, 255, 0.5)",
                borderTop: "2px solid #FFFFFF",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M14 2L7 9M14 2L9.5 14L7 9M14 2L2 6.5L7 9"
                stroke="#FFFFFF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
