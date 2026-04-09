import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  const batchId = request.nextUrl.searchParams.get("batchId");
  const nextPath = request.nextUrl.searchParams.get("next") || "/dashboard";

  if (!batchId) {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";

  const cookieStore = await cookies();
  cookieStore.set("selected_batch_id", batchId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.redirect(`${origin}${safeNext}`);
}
