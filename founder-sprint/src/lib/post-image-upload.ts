import { cleanupUploadedPostImages } from "@/actions/feed";
import {
  POST_IMAGE_BUCKET,
  POST_IMAGE_MAX_FILES,
  validatePostImageFiles,
} from "@/lib/post-images";

interface UploadRouteSuccess {
  success: true;
  path: string;
}

interface UploadRouteFailure {
  success: false;
  error?: string;
}

type UploadRouteResponse = UploadRouteSuccess | UploadRouteFailure;

export async function uploadPostImages(
  files: File[]
): Promise<{ success: true; data: string[] } | { success: false; error: string }> {
  if (files.length === 0) {
    return { success: true, data: [] };
  }

  if (files.length > POST_IMAGE_MAX_FILES) {
    return {
      success: false,
      error: `You can upload up to ${POST_IMAGE_MAX_FILES} images per post.`,
    };
  }

  const validationError = validatePostImageFiles(files);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const uploadedPaths: string[] = [];

  try {
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", POST_IMAGE_BUCKET);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as UploadRouteResponse;

      if (!response.ok || !result.success || !result.path) {
        if (uploadedPaths.length > 0) {
          await cleanupUploadedPostImages(uploadedPaths).catch(() => {});
        }

        return {
          success: false,
          error: ("error" in result && result.error) || `Failed to upload ${file.name}.`,
        };
      }

      uploadedPaths.push(result.path);
    }

    return { success: true, data: uploadedPaths };
  } catch {
    if (uploadedPaths.length > 0) {
      await cleanupUploadedPostImages(uploadedPaths).catch(() => {});
    }

    return { success: false, error: "Image upload failed. Please try again." };
  }
}
