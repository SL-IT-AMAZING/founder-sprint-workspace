export function getPublicBucketStoragePath(
  url: string | null | undefined,
  bucket: string
): string | null {
  const value = url?.trim();
  if (!value) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) return null;

  let parsed: URL;
  let base: URL;

  try {
    parsed = new URL(value);
    base = new URL(supabaseUrl);
  } catch {
    return null;
  }

  if (parsed.origin !== base.origin) return null;

  const prefix = `/storage/v1/object/public/${bucket}/`;
  if (!parsed.pathname.startsWith(prefix)) return null;

  const storagePath = parsed.pathname.slice(prefix.length);
  return storagePath || null;
}

export function getProfileImageStoragePath(url: string | null | undefined): string | null {
  return getPublicBucketStoragePath(url, "profile-images");
}

export function getPostImageStoragePath(url: string | null | undefined): string | null {
  return getPublicBucketStoragePath(url, "post-images");
}
