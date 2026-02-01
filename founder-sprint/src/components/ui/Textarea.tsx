"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={`form-input ${className || ""}`}
          style={{
            height: "auto",
            minHeight: 100,
            resize: "vertical",
            paddingTop: 12,
            paddingBottom: 12,
            borderRadius: 6,
            ...(error ? { borderColor: "var(--color-error)" } : {}),
          }}
          {...props}
        />
        {error && (
          <p className="text-xs" style={{ color: "var(--color-error)" }}>
            {error}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
