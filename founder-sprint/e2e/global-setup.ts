import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const TEST_USERS = {
  admin: "test-admin@example.com",
  founder: "test-founder@example.com",
  mentor: "test-mentor@example.com",
} as const;

const E2E_PASSWORD = "e2e-test-secure-Pw-991!";

export default async function globalSetup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    throw new Error(
      "Missing required env vars for E2E auth: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const authDir = path.join(__dirname, ".auth");
  fs.mkdirSync(authDir, { recursive: true });

  const { data: listData } = await adminSupabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const existingUsers = listData?.users ?? [];

  for (const [role, email] of Object.entries(TEST_USERS)) {
    const existing = existingUsers.find((u) => u.email === email);

    if (existing) {
      await adminSupabase.auth.admin.updateUserById(existing.id, {
        password: E2E_PASSWORD,
      });
    } else {
      const { error } = await adminSupabase.auth.admin.createUser({
        email,
        password: E2E_PASSWORD,
        email_confirm: true,
      });
      if (error) {
        throw new Error(`Failed to create auth user ${email}: ${error.message}`);
      }
    }

    const response = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
        },
        body: JSON.stringify({ email, password: E2E_PASSWORD }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Sign-in failed for ${email}: ${text}`);
    }

    const session = await response.json();
    const sessionJson = JSON.stringify(session);
    const encoded = encodeURIComponent(sessionJson);

    const CHUNK_SIZE = 3180;
    const cookieName = `sb-${projectRef}-auth-token`;
    const cookies: Array<{
      name: string;
      value: string;
      domain: string;
      path: string;
      expires: number;
      httpOnly: boolean;
      secure: boolean;
      sameSite: "Lax";
    }> = [];

    if (encoded.length <= CHUNK_SIZE) {
      cookies.push({
        name: cookieName,
        value: encoded,
        domain: "localhost",
        path: "/",
        expires: session.expires_at ?? -1,
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      });
    } else {
      let index = 0;
      let chunkNum = 0;
      while (index < sessionJson.length) {
        const chunk = sessionJson.substring(index, index + CHUNK_SIZE);
        cookies.push({
          name: `${cookieName}.${chunkNum}`,
          value: encodeURIComponent(chunk),
          domain: "localhost",
          path: "/",
          expires: session.expires_at ?? -1,
          httpOnly: false,
          secure: false,
          sameSite: "Lax",
        });
        index += CHUNK_SIZE;
        chunkNum++;
      }
    }

    fs.writeFileSync(
      path.join(authDir, `${role}.json`),
      JSON.stringify({ cookies, origins: [] }, null, 2)
    );
  }
}
