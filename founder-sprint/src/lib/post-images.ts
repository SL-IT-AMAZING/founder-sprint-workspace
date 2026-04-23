export const POST_IMAGE_BUCKET = "post-images";
export const POST_IMAGE_MAX_FILES = 5;
export const POST_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const POST_IMAGE_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
] as const;

export interface PostImageUploadPayload {
  path: string;
}

export function validatePostImageFiles(
  incomingFiles: File[],
  existingCount: number = 0
): string | null {
  if (existingCount + incomingFiles.length > POST_IMAGE_MAX_FILES) {
    return `You can upload up to ${POST_IMAGE_MAX_FILES} images per post.`;
  }

  const invalidType = incomingFiles.find(
    (file) => !POST_IMAGE_ALLOWED_TYPES.includes(file.type as (typeof POST_IMAGE_ALLOWED_TYPES)[number])
  );
  if (invalidType) {
    return "Only JPEG, PNG, and GIF images are allowed.";
  }

  const oversized = incomingFiles.find((file) => file.size > POST_IMAGE_MAX_SIZE_BYTES);
  if (oversized) {
    return "Each image must be 5MB or smaller.";
  }

  return null;
}
