export type AvatarSource = 'empty' | 'linkedin' | 'internal' | 'external';

export function classifyAvatarSource(url: string | null | undefined): AvatarSource {
  const value = url?.trim();
  if (!value) return 'empty';

  try {
    const parsed = new URL(value);
    if (parsed.hostname.toLowerCase() === 'media.licdn.com') return 'linkedin';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    if (supabaseUrl) {
      const base = new URL(supabaseUrl);
      if (
        parsed.origin === base.origin &&
        parsed.pathname.startsWith('/storage/v1/object/public/profile-images/')
      ) {
        return 'internal';
      }
    }
  } catch {
    return 'external';
  }

  return 'external';
}
