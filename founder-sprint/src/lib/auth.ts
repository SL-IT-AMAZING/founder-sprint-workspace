import { headers } from "next/headers";

export async function getAuthUserFromHeaders(): Promise<{ id: string; email: string } | null> {
  const headerStore = await headers();
  const userId = headerStore.get("x-auth-user-id");
  const userEmail = headerStore.get("x-auth-user-email");
  if (!userId || !userEmail) return null;
  return { id: userId, email: userEmail };
}
