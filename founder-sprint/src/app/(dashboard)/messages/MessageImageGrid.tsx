"use client";

/* eslint-disable @next/next/no-img-element -- Supabase public images and lightbox need unconstrained rendering. */

import { useEffect, useState } from "react";
import type { MessageAttachmentItem } from "@/actions/messaging";

interface MessageImageGridProps {
  images: MessageAttachmentItem[];
  isOwn: boolean;
}

export default function MessageImageGrid({ images, isOwn }: MessageImageGridProps) {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const hasMultipleImages = images.length > 1;
  const activeImage = activeImageIndex === null ? null : images[activeImageIndex];

  useEffect(() => {
    if (activeImageIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveImageIndex(null);
        return;
      }

      if (!hasMultipleImages) return;

      if (event.key === "ArrowLeft") {
        setActiveImageIndex((current) => {
          if (current === null) return current;
          return current === 0 ? images.length - 1 : current - 1;
        });
      }

      if (event.key === "ArrowRight") {
        setActiveImageIndex((current) => {
          if (current === null) return current;
          return current === images.length - 1 ? 0 : current + 1;
        });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeImageIndex, hasMultipleImages, images.length]);

  if (images.length === 0) return null;

  const isSingle = images.length === 1;
  const isPair = images.length === 2;
  const isRail = images.length >= 3;

  return (
    <>
      <div
        aria-label={`${images.length} message image${images.length === 1 ? "" : "s"}`}
        style={{
          display: isRail ? "flex" : "grid",
          gridTemplateColumns: isPair ? "repeat(2, minmax(0, 1fr))" : "1fr",
          gap: "6px",
          width: isSingle ? "min(280px, 58vw)" : "min(360px, 58vw)",
          overflowX: isRail ? "auto" : undefined,
          overflowY: isRail ? "hidden" : undefined,
          paddingBottom: isRail ? "2px" : undefined,
          scrollSnapType: isRail ? "x proximity" : undefined,
          scrollbarWidth: isRail ? "thin" : undefined,
        }}
      >
        {images.map((image, index) => (
          <div
            key={image.id || image.imageUrl}
            role="button"
            tabIndex={0}
            onClick={() => setActiveImageIndex(index)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setActiveImageIndex(index);
              }
            }}
            style={{
              borderRadius: isPair ? "12px" : "14px",
              overflow: "hidden",
              border: "1px solid #E8E1D4",
              backgroundColor: isOwn ? "#242424" : "#F6F2EA",
              cursor: "zoom-in",
              aspectRatio: isSingle || isRail ? "4 / 3" : "1 / 1",
              height: isPair ? "clamp(120px, 18vw, 170px)" : undefined,
              width: isRail ? "clamp(150px, 30vw, 190px)" : undefined,
              flex: isRail ? "0 0 auto" : undefined,
              scrollSnapAlign: isRail ? "start" : undefined,
            }}
          >
            <img
              src={image.imageUrl}
              alt={image.fileName || `Message image ${index + 1}`}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
          </div>
        ))}
      </div>

      {activeImage && activeImageIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Message image ${activeImageIndex + 1} of ${images.length}`}
          onClick={() => setActiveImageIndex(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            backgroundColor: "rgba(18, 17, 15, 0.88)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            cursor: "zoom-out",
          }}
        >
          <button
            type="button"
            aria-label="Close image preview"
            onClick={() => setActiveImageIndex(null)}
            style={{
              position: "absolute",
              top: "18px",
              right: "18px",
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              border: "1px solid rgba(255, 255, 255, 0.22)",
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              color: "white",
              fontSize: "24px",
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ×
          </button>

          {hasMultipleImages && (
            <button
              type="button"
              aria-label="Previous image"
              onClick={(event) => {
                event.stopPropagation();
                setActiveImageIndex((current) => {
                  if (current === null) return current;
                  return current === 0 ? images.length - 1 : current - 1;
                });
              }}
              style={{
                position: "absolute",
                left: "18px",
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                border: "1px solid rgba(255, 255, 255, 0.22)",
                backgroundColor: "rgba(255, 255, 255, 0.12)",
                color: "white",
                fontSize: "28px",
                lineHeight: 1,
                cursor: "pointer",
              }}
            >
              ‹
            </button>
          )}

          <img
            src={activeImage.imageUrl}
            alt={activeImage.fileName || `Message image ${activeImageIndex + 1} expanded`}
            onClick={(event) => event.stopPropagation()}
            style={{
              maxWidth: "min(100%, 1120px)",
              maxHeight: "90vh",
              width: "auto",
              height: "auto",
              objectFit: "contain",
              borderRadius: "12px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
              cursor: "default",
            }}
          />

          {hasMultipleImages && (
            <button
              type="button"
              aria-label="Next image"
              onClick={(event) => {
                event.stopPropagation();
                setActiveImageIndex((current) => {
                  if (current === null) return current;
                  return current === images.length - 1 ? 0 : current + 1;
                });
              }}
              style={{
                position: "absolute",
                right: "18px",
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                border: "1px solid rgba(255, 255, 255, 0.22)",
                backgroundColor: "rgba(255, 255, 255, 0.12)",
                color: "white",
                fontSize: "28px",
                lineHeight: 1,
                cursor: "pointer",
              }}
            >
              ›
            </button>
          )}

          {hasMultipleImages && (
            <div
              style={{
                position: "absolute",
                bottom: "18px",
                left: "50%",
                transform: "translateX(-50%)",
                padding: "5px 10px",
                borderRadius: "999px",
                backgroundColor: "rgba(255, 255, 255, 0.14)",
                color: "white",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {activeImageIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
