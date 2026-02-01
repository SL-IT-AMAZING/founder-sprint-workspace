import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const errorRedirect = `${origin}/login?error=`;

  // No code = invalid callback
  if (!code) {
    return NextResponse.redirect(`${errorRedirect}missing_code`);
  }

  const supabase = await createClient();

  // Exchange code for session
  const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

  if (sessionError || !sessionData.user) {
    console.error("Auth callback error:", sessionError?.message);
    return NextResponse.redirect(`${errorRedirect}auth_failed`);
  }

  const authUser = sessionData.user;
  const email = authUser.email;

  if (!email) {
    return NextResponse.redirect(`${errorRedirect}no_email`);
  }

  try {
    // Check if user exists in our database (must be pre-invited)
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        userBatches: {
          where: { status: "invited" },
          include: { batch: true },
        },
      },
    });

    // User must exist and have at least one batch invitation
    if (!user) {
      // User not invited - redirect to no-batch page
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/no-batch`);
    }

    // Check for pending invitations to activate
    const pendingInvitations = user.userBatches.filter(ub => ub.status === "invited");

    if (pendingInvitations.length > 0) {
      // Activate all pending invitations
      await prisma.userBatch.updateMany({
        where: {
          userId: user.id,
          status: "invited",
        },
        data: {
          status: "active",
          joinedAt: new Date(),
        },
      });
    }

    // Update user profile with LinkedIn data (if first login or data changed)
    const linkedinId = authUser.user_metadata?.sub || authUser.id;
    const fullName = authUser.user_metadata?.full_name || authUser.user_metadata?.name;
    const avatarUrl = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture;

    const updateData: {
      linkedinId?: string;
      name?: string;
      profileImage?: string;
    } = {};

    if (!user.linkedinId && linkedinId) {
      updateData.linkedinId = linkedinId;
    }
    if (fullName && (!user.name || user.name === email.split("@")[0])) {
      updateData.name = fullName;
    }
    if (avatarUrl && !user.profileImage) {
      updateData.profileImage = avatarUrl;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    // Refresh user data after updates
    user = await prisma.user.findUnique({
      where: { email },
      include: {
        userBatches: {
          where: { status: "active" },
          include: { batch: true },
        },
      },
    });

    // Check if user has active batch membership
    if (!user || user.userBatches.length === 0) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/no-batch`);
    }

    // Check if profile is incomplete (needs onboarding)
    const needsOnboarding = !user.jobTitle || !user.company;

    if (needsOnboarding) {
      return NextResponse.redirect(`${origin}/settings?onboarding=true`);
    }

    // Success - redirect to dashboard or requested page
    return NextResponse.redirect(`${origin}${next}`);

  } catch (error) {
    console.error("Auth callback database error:", error);
    return NextResponse.redirect(`${errorRedirect}server_error`);
  }
}
