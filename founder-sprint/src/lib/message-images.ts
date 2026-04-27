// Reuse the existing public image bucket so message images do not require
// a separate Supabase storage bucket rollout.
export const MESSAGE_IMAGE_BUCKET = "post-images";
export const MESSAGE_IMAGE_MAX_FILES = 5;
export const MESSAGE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const MESSAGE_IMAGE_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export interface MessageImageUploadPayload {
  imageUrl: string;
  storagePath: string;
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
}

export function validateMessageImageFiles(
  incomingFiles: File[],
  existingCount: number = 0
): string | null {
  if (existingCount + incomingFiles.length > MESSAGE_IMAGE_MAX_FILES) {
    return `You can upload up to ${MESSAGE_IMAGE_MAX_FILES} images per message.`;
  }

  const invalidType = incomingFiles.find(
    (file) =>
      !MESSAGE_IMAGE_ALLOWED_TYPES.includes(
        file.type as (typeof MESSAGE_IMAGE_ALLOWED_TYPES)[number]
      )
  );
  if (invalidType) {
    return "Only JPEG, PNG, GIF, and WebP images are allowed.";
  }

  const oversized = incomingFiles.find((file) => file.size > MESSAGE_IMAGE_MAX_SIZE_BYTES);
  if (oversized) {
    return "Each image must be 5MB or smaller.";
  }

  return null;
}
