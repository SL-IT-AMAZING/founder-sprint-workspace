import { createClient } from "@supabase/supabase-js";

export async function ingestLinkedInAvatar(
  userId: string,
  linkedInAvatarUrl: string
): Promise<string | null> {
  try {
    const response = await fetch(linkedInAvatarUrl);
    if (!response.ok) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const path = `${userId}/provider-${Date.now()}.jpg`;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.storage
      .from("profile-images")
      .upload(path, buffer, { contentType, upsert: true });

    if (error || !data?.path) {
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("profile-images")
      .getPublicUrl(data.path);

    return urlData.publicUrl || null;
  } catch (error) {
    console.error("[LinkedInAvatarIngest] Failed to ingest LinkedIn avatar:", error);
    return null;
  }
}
