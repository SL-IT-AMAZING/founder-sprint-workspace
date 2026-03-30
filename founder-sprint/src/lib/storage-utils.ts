export function getProfileImageStoragePath(url: string | null | undefined): string | null {
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

  const prefix = "/storage/v1/object/public/profile-images/";
  if (!parsed.pathname.startsWith(prefix)) return null;

  const storagePath = parsed.pathname.slice(prefix.length);
  return storagePath || null;
}
