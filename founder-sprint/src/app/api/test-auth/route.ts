import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const ALLOWED_ENVS = ["development", "test"];

type TestRole = "admin" | "founder" | "mentor" | "super_admin";

export async function POST(request: Request) {
  if (!ALLOWED_ENVS.includes(process.env.NODE_ENV || "")) {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  const { email, role = "admin" } = (await request.json()) as { email: string; role: TestRole };

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  let authUser = existingUsers?.users?.find((u) => u.email === email);

  if (!authUser) {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { name: `Test ${role}`, role },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }
    authUser = newUser.user;
  }

  let activeBatch = await prisma.batch.findFirst({
    where: { status: "active" },
  });

  if (!activeBatch) {
    const now = new Date();
    const threeMonthsLater = new Date(now);
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    
    activeBatch = await prisma.batch.create({
      data: {
        name: "Test Batch",
        status: "active",
        startDate: now,
        endDate: threeMonthsLater,
      },
    });
  }

  let dbUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        email,
        name: `Test ${role}`,
        linkedinId: authUser.id,
        jobTitle: "Test Title",
        company: "Test Company",
      },
    });
  }

  const existingMembership = await prisma.userBatch.findFirst({
    where: {
      userId: dbUser.id,
      batchId: activeBatch.id,
    },
  });

  if (!existingMembership) {
    await prisma.userBatch.create({
      data: {
        userId: dbUser.id,
        batchId: activeBatch.id,
        role: role === "super_admin" ? "super_admin" : role,
        status: "active",
        joinedAt: new Date(),
      },
    });
  }

  const { data: session, error: sessionError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (sessionError || !session.properties?.hashed_token) {
    return NextResponse.json(
      { error: sessionError?.message || "Failed to generate session" },
      { status: 500 }
    );
  }

  const { data: tokenData, error: tokenError } = await supabase.auth.verifyOtp({
    email,
    token: session.properties.hashed_token,
    type: "email",
  });

  if (tokenError || !tokenData.session) {
    return NextResponse.json(
      { error: tokenError?.message || "Failed to verify token" },
      { status: 500 }
    );
  }

  const cookieStore = await cookies();
  const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  const sessionValue = JSON.stringify({
    access_token: tokenData.session.access_token,
    refresh_token: tokenData.session.refresh_token,
  });

  cookieStore.set(cookieName, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({
    success: true,
    user: { id: dbUser.id, email: dbUser.email, role },
    batchId: activeBatch.id,
  });
}
