"use client";

import { useState, useRef, KeyboardEvent } from "react";

interface MessageComposerProps {
  onSend: (content: string) => void | Promise<void>;
  disabled: boolean;
}

export default function MessageComposer({ onSend, disabled }: MessageComposerProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendingRef = useRef(false);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || disabled || sendingRef.current) return;

    sendingRef.current = true;
    setIsSending(true);

    try {
      await onSend(trimmed);
      setMessage("");

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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-grow textarea (max 4 lines)
    const textarea = e.target;
    textarea.style.height = "auto";
    const lineHeight = 20; // approximate
    const maxHeight = lineHeight * 4;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  };

  const canSend = message.trim().length > 0 && !disabled && !isSending;

  return (
    <div
      style={{
        borderTop: "1px solid #e0e0e0",
        backgroundColor: "#FFFFFF",
        padding: "12px 16px",
      }}
    >
      <div className="flex" style={{ alignItems: "flex-end", gap: "8px" }}>
        {/* Input */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
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
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M14 2L7 9M14 2L9.5 14L7 9M14 2L2 6.5L7 9"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
