import { createClient } from "./server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

export type UploadResult = {
  success: true;
  path: string;
  fullPath: string;
} | {
  success: false;
  error: string;
};

export type DeleteResult = {
  success: true;
} | {
  success: false;
  error: string;
};

function validateFile(file: File): { valid: true } | { valid: false; error: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
    };
  }

  return { valid: true };
}

function generateFilePath(fileName: string, folder?: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${timestamp}-${randomSuffix}-${sanitizedName}`;
  
  return folder ? `${folder}/${path}` : path;
}

export async function uploadFile(
  bucket: string,
  file: File,
  options?: {
    folder?: string;
    upsert?: boolean;
  }
): Promise<UploadResult> {
  const validation = validateFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const supabase = await createClient();
    const filePath = generateFilePath(file.name, options?.folder);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: options?.upsert ?? false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      path: data.path,
      fullPath: data.fullPath,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

export async function getPublicUrl(bucket: string, path: string): Promise<string> {
  const supabase = await createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFile(bucket: string, path: string): Promise<DeleteResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

export async function deleteFiles(bucket: string, paths: string[]): Promise<DeleteResult> {
  if (paths.length === 0) {
    return { success: true };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error occurred",
    };
  }
}

export { MAX_FILE_SIZE, ALLOWED_MIME_TYPES };
