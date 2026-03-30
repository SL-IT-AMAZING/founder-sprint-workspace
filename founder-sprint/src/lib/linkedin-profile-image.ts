export function isLinkedInProfileImageUrl(url: string | null | undefined): boolean {
  const value = url?.trim();
  if (!value) return false;

  try {
    const parsed = new URL(value);
    return parsed.hostname.toLowerCase() === "media.licdn.com";
  } catch {
    return false;
  }
}
