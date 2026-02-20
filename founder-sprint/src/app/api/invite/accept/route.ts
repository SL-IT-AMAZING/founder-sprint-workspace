import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${origin}/login?error=invalid_invite`);
  }

  const invitation = await prisma.invitationToken.findUnique({
    where: { token },
  });

  if (!invitation) {
    return NextResponse.redirect(`${origin}/login?error=invalid_invite`);
  }

  if (invitation.usedAt) {
    return NextResponse.redirect(`${origin}/login?error=invite_used`);
  }

  if (invitation.expiresAt < new Date()) {
    return NextResponse.redirect(`${origin}/login?error=invitation_expired`);
  }

  const response = NextResponse.redirect(`${origin}/login`);
  response.cookies.set("invite_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60,
    path: "/",
  });

  return response;
}
