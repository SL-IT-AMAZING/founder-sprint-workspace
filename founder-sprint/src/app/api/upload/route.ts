import { createClient as createServerClient } from "@/lib/supabase/server";
import { getProfileImageStoragePath } from "@/lib/storage-utils";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag as revalidateTagBase } from "next/cache";

const revalidateTag = (tag: string) => revalidateTagBase(tag, "default");

function createStorageClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const BUCKET_CONFIG = {
  "question-attachments": {
    maxSize: 10 * 1024 * 1024,
    maxFiles: 5,
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "application/pdf"],
    adminOnly: false,
  },
  "post-images": {
    maxSize: 5 * 1024 * 1024,
    maxFiles: 5,
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    adminOnly: false,
  },
  "company-logos": {
    maxSize: 2 * 1024 * 1024,
    maxFiles: 1,
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/svg+xml"],
    adminOnly: true,
  },
  "group-images": {
    maxSize: 2 * 1024 * 1024,
    maxFiles: 1,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    adminOnly: false,
  },
  "profile-images": {
    maxSize: 2 * 1024 * 1024,
    maxFiles: 1,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    adminOnly: false,
  },
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
    const companyIdRaw = formData.get("companyId");
    const companyId = typeof companyIdRaw === "string" && companyIdRaw.trim() ? companyIdRaw.trim() : null;

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

    // Validate file type
    if (!(config.allowedTypes as readonly string[]).includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `File type not allowed. Allowed types: ${config.allowedTypes.join(", ")}`,
          code: "INVALID_FILE_TYPE",
        },
        { status: 400 }
      );
    }

    const authClient = await createServerClient();

    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Authorization: admin-only buckets check role, others check batch membership
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { id: true, role: true },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    if (config.adminOnly) {
      if (dbUser.role !== "admin" && dbUser.role !== "super_admin") {
        const canManageCompanyLogo =
          bucket === "company-logos" &&
          companyId &&
          (await prisma.companyMember.findFirst({
            where: {
              companyId,
              userId: dbUser.id,
              isCurrent: true,
              user: {
                OR: [
                  { role: { in: ["founder", "co_founder"] } },
                  {
                    userBatches: {
                      some: {
                        status: "active",
                        role: { in: ["founder", "co_founder"] },
                      },
                    },
                  },
                ],
              },
            },
            select: { id: true },
          }));

        if (!canManageCompanyLogo) {
          return NextResponse.json(
            { success: false, error: "Admin or company founder access required", code: "FORBIDDEN" },
            { status: 403 }
          );
        }
      }
    } else {
      const activeMembership = await prisma.userBatch.findFirst({
        where: {
          user: { email: user.email! },
          status: "active",
        },
      });

      if (!activeMembership) {
        return NextResponse.json(
          { success: false, error: "No active batch membership", code: "FORBIDDEN" },
          { status: 403 }
        );
      }
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${dbUser.id}/${Date.now()}-${sanitizedName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const storage = createStorageClient();
    const { data, error } = await storage.storage
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

    const { data: urlData } = storage.storage
      .from(bucket)
      .getPublicUrl(data.path);

    if (bucket === "profile-images") {
      const currentProfile = await prisma.user.findUnique({
        where: { id: dbUser.id },
        select: { profileImage: true },
      });

      try {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { profileImage: urlData.publicUrl },
        });
      } catch (dbError) {
        await storage.storage.from(bucket).remove([data.path]).catch(() => {});
        console.error("[Upload] Failed to persist profile image URL:", dbError);
        return NextResponse.json(
          {
            success: false,
            error: "Upload saved file but failed to persist profile image.",
            code: "PROFILE_PERSIST_FAILED",
          },
          { status: 500 }
        );
      }

      const oldPath = getProfileImageStoragePath(currentProfile?.profileImage);
      if (oldPath && oldPath !== data.path) {
        await storage.storage.from(bucket).remove([oldPath]).catch((cleanupError) => {
          console.error("[Upload] Failed to delete old profile image:", cleanupError);
        });
      }

      revalidatePath("/settings");
      revalidatePath(`/profile/${dbUser.id}`);
      revalidatePath("/feed");
      revalidateTag("current-user");
    }

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
