"use server";

import {
  uploadFile,
  getPublicUrl,
  deleteFile,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
} from "@/lib/supabase/storage";

const DEFAULT_BUCKET = "uploads";

export type UploadActionResult = {
  success: true;
  path: string;
  publicUrl: string;
} | {
  success: false;
  error: string;
};

export type DeleteActionResult = {
  success: true;
} | {
  success: false;
  error: string;
};

export async function uploadFileAction(
  formData: FormData,
  bucket: string = DEFAULT_BUCKET,
  folder?: string
): Promise<UploadActionResult> {
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return { success: false, error: "No file provided" };
  }

  if (file.size === 0) {
    return { success: false, error: "File is empty" };
  }

  const result = await uploadFile(bucket, file, { folder });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const publicUrl = await getPublicUrl(bucket, result.path);

  return {
    success: true,
    path: result.path,
    publicUrl,
  };
}

export async function deleteFileAction(
  path: string,
  bucket: string = DEFAULT_BUCKET
): Promise<DeleteActionResult> {
  if (!path) {
    return { success: false, error: "No file path provided" };
  }

  return await deleteFile(bucket, path);
}

export async function getUploadConstraints() {
  return {
    maxFileSize: MAX_FILE_SIZE,
    maxFileSizeMB: MAX_FILE_SIZE / (1024 * 1024),
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    allowedExtensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf"],
  };
}
