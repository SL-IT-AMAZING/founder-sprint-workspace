"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  POST_IMAGE_ALLOWED_TYPES,
  POST_IMAGE_MAX_FILES,
  validatePostImageFiles,
} from "@/lib/post-images";

interface PostImagePickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}

export function PostImagePicker({
  files,
  onChange,
  disabled = false,
}: PostImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const previewUrls = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files]
  );

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleSelectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files || []);
    if (nextFiles.length === 0) return;

    const validationError = validatePostImageFiles(nextFiles, files.length);
    if (validationError) {
      setError(validationError);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setError(null);
    onChange([...files, ...nextFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemove = (index: number) => {
    setError(null);
    onChange(files.filter((_, currentIndex) => currentIndex !== index));
  };

  const hasFiles = files.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: hasFiles ? "12px" : "8px", marginTop: "10px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 12px",
            borderRadius: "999px",
            border: "1px solid #DDD4C4",
            backgroundColor: "#FFFFFF",
            color: "#6E675B",
            fontSize: "13px",
            fontWeight: 600,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.6 : 1,
            transition: "all 0.2s ease",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M8 15l2.4-2.7a1 1 0 0 1 1.5 0l1.8 2a1 1 0 0 0 1.45.02L17 12.4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="9" cy="9" r="1.2" fill="currentColor" />
          </svg>
          Add photos
        </button>

        {hasFiles ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "6px 10px",
              borderRadius: "999px",
              border: "1px solid #E7DFCF",
              backgroundColor: "#F7F2E8",
              color: "#7A7468",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {files.length}/{POST_IMAGE_MAX_FILES} selected
          </span>
        ) : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={POST_IMAGE_ALLOWED_TYPES.join(",")}
        multiple
        hidden
        onChange={handleSelectFiles}
      />

      {error && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid rgba(198, 40, 40, 0.2)",
            backgroundColor: "rgba(198, 40, 40, 0.06)",
            color: "#a33a32",
            fontSize: "12px",
          }}
        >
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(78px, 1fr))",
            gap: "10px",
            padding: "10px",
            borderRadius: "12px",
            border: "1px solid #ECE3D5",
            backgroundColor: "#FBF8F2",
          }}
        >
          {previewUrls.map((previewUrl, index) => (
            <div
              key={`${files[index]?.name || "image"}-${index}`}
              style={{
                position: "relative",
                borderRadius: "10px",
                overflow: "hidden",
                border: "1px solid #E7DFCF",
                backgroundColor: "#F6F2EA",
                aspectRatio: "1 / 1",
              }}
            >
              <img
                src={previewUrl}
                alt={`Selected upload ${index + 1}`}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                aria-label={`Remove image ${index + 1}`}
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  width: "22px",
                  height: "22px",
                  borderRadius: "999px",
                  border: "none",
                  backgroundColor: "rgba(0,0,0,0.7)",
                  color: "#FFFFFF",
                  fontSize: "13px",
                  cursor: disabled ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
