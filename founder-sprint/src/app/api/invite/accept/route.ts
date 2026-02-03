import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  // Validate token parameter exists
  if (!token) {
    redirect("/login?error=invalid_invite");
  }

  // Find the invitation token in the database
  const invitation = await prisma.invitationToken.findUnique({
    where: { token },
  });

  // Check if token exists
  if (!invitation) {
    redirect("/login?error=invalid_invite");
  }

  // Check if token has already been used
  if (invitation.usedAt) {
    redirect("/login?error=invite_used");
  }

  // Check if token has expired
  if (invitation.expiresAt < new Date()) {
    redirect("/login?error=invitation_expired");
  }

  // Token is valid - set the cookie
  const cookieStore = await cookies();
  cookieStore.set("invite_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
    path: "/",
  });

  // Redirect to login page
  redirect("/login");
}
