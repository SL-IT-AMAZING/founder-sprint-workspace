import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const BUCKET_CONFIG = {
  "question-attachments": { maxSize: 10 * 1024 * 1024, maxFiles: 5 },
  "post-images": { maxSize: 5 * 1024 * 1024, maxFiles: 5 },
} as const;

type BucketName = keyof typeof BUCKET_CONFIG;

interface UploadResponse {
  success: boolean;
  url?: string;
  fileName?: string;
  path?: string;
  error?: string;
  code?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<UploadResponse>> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = formData.get("bucket") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided", code: "NO_FILE" },
        { status: 400 }
      );
    }

    if (!bucket || !(bucket in BUCKET_CONFIG)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid bucket. Allowed: ${Object.keys(BUCKET_CONFIG).join(", ")}`,
          code: "INVALID_BUCKET",
        },
        { status: 400 }
      );
    }

    const config = BUCKET_CONFIG[bucket as BucketName];

    if (file.size > config.maxSize) {
      const maxMB = config.maxSize / (1024 * 1024);
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds ${maxMB}MB limit`,
          code: "FILE_TOO_LARGE",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${user.id}/${Date.now()}-${sanitizedName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("[Upload] Supabase storage error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Upload failed. Please try again.",
          code: "UPLOAD_FAILED",
        },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName: file.name,
      path: data.path,
    });
  } catch (error) {
    console.error("[Upload] Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
