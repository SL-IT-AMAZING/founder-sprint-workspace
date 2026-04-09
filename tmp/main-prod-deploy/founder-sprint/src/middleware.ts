import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { rateLimit } from "@/lib/rate-limit";

const uploadLimiter = rateLimit({ windowMs: 60_000, max: 20 });
const inviteLimiter = rateLimit({ windowMs: 60_000, max: 10 });

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (pathname.startsWith("/api/upload")) {
    const result = uploadLimiter.check(`upload:${ip}`);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Too many requests", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  if (pathname.startsWith("/api/invite")) {
    const result = inviteLimiter.check(`invite:${ip}`);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Too many requests", code: "RATE_LIMITED" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|otf|woff|woff2)$).*)",
  ],
};
