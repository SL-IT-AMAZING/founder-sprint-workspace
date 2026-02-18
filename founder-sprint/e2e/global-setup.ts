import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import fs from "fs";
import path from "path";

// Load .env.local (Next.js convention) since Playwright runs outside Next.js
config({ path: path.resolve(__dirname, "../.env.local") });
config({ path: path.resolve(__dirname, "../.env") });

const TEST_USERS = {
  admin: { email: "test-admin@example.com", role: "admin" as const },
  founder: { email: "test-founder@example.com", role: "founder" as const },
  mentor: { email: "test-mentor@example.com", role: "mentor" as const },
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

  // Step 1: Create Supabase Auth users and generate session cookies
  for (const [role, { email }] of Object.entries(TEST_USERS)) {
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

  // Step 2: Create database records (User + UserBatch) so getCurrentUser() works
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  try {
    let batch = await prisma.batch.findFirst({
      where: { status: "active", endDate: { gte: new Date() } },
    });

    if (!batch) {
      batch = await prisma.batch.create({
        data: {
          name: "E2E Test Batch",
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          status: "active",
        },
      });
    }

    for (const [, { email, role }] of Object.entries(TEST_USERS)) {
      const user = await prisma.user.upsert({
        where: { email },
        create: { email, name: `Test ${role}` },
        update: {},
      });

      await prisma.userBatch.upsert({
        where: { userId_batchId: { userId: user.id, batchId: batch.id } },
        create: {
          userId: user.id,
          batchId: batch.id,
          role,
          status: "active",
          joinedAt: new Date(),
        },
        update: { status: "active", role },
      });
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
