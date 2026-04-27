import { cleanupUploadedMessageImages } from "@/actions/messaging";
import {
  MESSAGE_IMAGE_BUCKET,
  MESSAGE_IMAGE_MAX_FILES,
  type MessageImageUploadPayload,
  validateMessageImageFiles,
} from "@/lib/message-images";

interface UploadRouteSuccess {
  success: true;
  url: string;
  fileName?: string;
  path: string;
}

interface UploadRouteFailure {
  success: false;
  error?: string;
}

type UploadRouteResponse = UploadRouteSuccess | UploadRouteFailure;

export async function uploadMessageImages(
  files: File[]
): Promise<
  | { success: true; data: MessageImageUploadPayload[] }
  | { success: false; error: string }
> {
  if (files.length === 0) {
    return { success: true, data: [] };
  }

  if (files.length > MESSAGE_IMAGE_MAX_FILES) {
    return {
      success: false,
      error: `You can upload up to ${MESSAGE_IMAGE_MAX_FILES} images per message.`,
    };
  }

  const validationError = validateMessageImageFiles(files);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const uploaded: MessageImageUploadPayload[] = [];

  try {
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", MESSAGE_IMAGE_BUCKET);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as UploadRouteResponse;

      if (!response.ok || !result.success || !result.path || !result.url) {
        if (uploaded.length > 0) {
          await cleanupUploadedMessageImages(uploaded.map((item) => item.storagePath)).catch(
            () => {}
          );
        }

        return {
          success: false,
          error: ("error" in result && result.error) || `Failed to upload ${file.name}.`,
        };
      }

      uploaded.push({
        imageUrl: result.url,
        storagePath: result.path,
        fileName: result.fileName || file.name,
        mimeType: file.type || null,
        sizeBytes: file.size,
      });
    }

    return { success: true, data: uploaded };
  } catch {
    if (uploaded.length > 0) {
      await cleanupUploadedMessageImages(uploaded.map((item) => item.storagePath)).catch(
        () => {}
      );
    }

    return { success: false, error: "Image upload failed. Please try again." };
  }
}
