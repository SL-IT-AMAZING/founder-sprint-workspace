import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { revalidateTag as revalidateTagBase } from "next/cache";

const revalidateTag = (tag: string) => revalidateTagBase(tag, "default");

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
  const email = authUser.email?.toLowerCase().trim();

  if (!email) {
    return NextResponse.redirect(`${errorRedirect}no_email`);
  }

  try {
    // Check if user exists in our database
    let user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      include: {
        userBatches: {
          where: { status: "invited" },
          include: { batch: true },
        },
      },
    });

    // Ghost user fallback: user found by email but has zero batch memberships anywhere
    if (user && user.userBatches.length === 0) {
      // IMPORTANT: count ALL statuses, not just invited (the include above filters to invited only)
      const totalBatchCount = await prisma.userBatch.count({
        where: { userId: user.id },
      });

      if (totalBatchCount === 0) {
        const cookieStore = await cookies();
        const inviteToken = cookieStore.get("invite_token")?.value;

        if (inviteToken) {
          const invitation = await prisma.invitationToken.findUnique({
            where: { token: inviteToken, usedAt: null },
            select: { userId: true, expiresAt: true },
          });

          if (invitation && invitation.expiresAt > new Date() && invitation.userId !== user.id) {
            // InvitationToken has no onDelete cascade — must delete manually before user
            await prisma.invitationToken.deleteMany({ where: { userId: user.id } });
            await prisma.user.delete({ where: { id: user.id } });

            await prisma.user.update({
              where: { id: invitation.userId },
              data: { email },
            });

            user = await prisma.user.findFirst({
              where: { id: invitation.userId },
              include: {
                userBatches: {
                  where: { status: "invited" },
                  include: { batch: true },
                },
              },
            });
          }
        }
      }
    }

    // If no user found by OAuth email, check invite_token cookie to match by invitation
    if (!user) {
      const cookieStore = await cookies();
      const inviteToken = cookieStore.get("invite_token")?.value;

      if (inviteToken) {
        const invitation = await prisma.invitationToken.findUnique({
          where: { token: inviteToken, usedAt: null },
          select: { userId: true, expiresAt: true },
        });

        if (invitation && invitation.expiresAt > new Date()) {
          const emailConflict = await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" }, id: { not: invitation.userId } },
          });

          if (!emailConflict) {
            await prisma.user.update({
              where: { id: invitation.userId },
              data: { email },
            });
          }

          user = await prisma.user.findFirst({
            where: { id: invitation.userId },
            include: {
              userBatches: {
                where: { status: "invited" },
                include: { batch: true },
              },
            },
          });
        }
      }
    }

    // User must exist (pre-invited or admin)
    if (!user) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/no-batch`);
    }

    // Super admin/admin can bypass batch requirement
    const isGlobalAdmin = user.role === "super_admin" || user.role === "admin";

    // Check for pending invitations to activate (7-day expiry)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const pendingInvitations = user.userBatches.filter(
      (ub: { status: string; invitedAt: Date }) => ub.status === "invited"
    );
    const validInvitations = pendingInvitations.filter(
      (ub: { invitedAt: Date }) => new Date(ub.invitedAt) > sevenDaysAgo
    );

    if (validInvitations.length > 0) {
      // Activate only valid (non-expired) invitations
      const validIds = validInvitations.map((ub: { id: string }) => ub.id);
      await prisma.userBatch.updateMany({
        where: {
          id: { in: validIds },
        },
        data: {
          status: "active",
          joinedAt: new Date(),
        },
      });

      // Invalidate caches so the user appears in feed sidebar immediately
      const activatedBatchIds = new Set(
        validInvitations.map((ub: { batchId: string }) => ub.batchId)
      );
      for (const bid of activatedBatchIds) {
        revalidateTag(`batch-users-${bid}`);
      }
      revalidateTag("current-user");

      // Mark invitation token as used (if present in cookie)
      const cookieStore = await cookies();
      const inviteToken = cookieStore.get("invite_token")?.value;
      if (inviteToken) {
        await prisma.invitationToken.updateMany({
          where: { token: inviteToken, usedAt: null },
          data: { usedAt: new Date() },
        });
        cookieStore.delete("invite_token");
      }
    }

    // If user had invitations but all expired, sign out and redirect
    if (pendingInvitations.length > 0 && validInvitations.length === 0) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${errorRedirect}invitation_expired`);
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
      const conflictingUser = await prisma.user.findFirst({
        where: { linkedinId, id: { not: user.id } },
      });

      if (conflictingUser) {
        const conflictBatchCount = await prisma.userBatch.count({
          where: { userId: conflictingUser.id },
        });

        if (conflictBatchCount === 0) {
          // InvitationToken has no onDelete cascade — must delete manually before user
          await prisma.invitationToken.deleteMany({ where: { userId: conflictingUser.id } });
          await prisma.user.delete({ where: { id: conflictingUser.id } });
          updateData.linkedinId = linkedinId;
        } else {
          console.warn(`LinkedIn ID conflict: user ${user.id} vs ${conflictingUser.id}, skipping`);
        }
      } else {
        updateData.linkedinId = linkedinId;
      }
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
    user = await prisma.user.findFirst({
      where: { id: user.id },
      include: {
        userBatches: {
          where: { status: "active" },
          include: { batch: true },
        },
      },
    });

    // Check if user has active batch membership (admins can bypass)
    const hasActiveBatch = user && user.userBatches.length > 0;
    const userIsGlobalAdmin = user?.role === "super_admin" || user?.role === "admin";
    
    if (!user || (!hasActiveBatch && !userIsGlobalAdmin)) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/no-batch`);
    }

    // Auto-populate company from group membership
    if (!user.company) {
      const groupMembership = await prisma.groupMember.findFirst({
        where: { userId: user.id },
        include: { group: { select: { name: true } } },
      });
      if (groupMembership) {
        await prisma.user.update({
          where: { id: user.id },
          data: { company: groupMembership.group.name },
        });
        user = { ...user, company: groupMembership.group.name };
      }
    }

    // Check if profile is incomplete (needs onboarding)
    const needsOnboarding = !user.jobTitle || !user.company;

    // Read cookies set by exchangeCodeForSession to propagate on redirect
    const cookieStore = await cookies();

    if (needsOnboarding) {
      const redirectResponse = NextResponse.redirect(`${origin}/settings?onboarding=true`);
      cookieStore.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });
      return redirectResponse;
    }

    // Success - redirect to dashboard or requested page
    const redirectResponse = NextResponse.redirect(`${origin}${next}`);
    cookieStore.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;

  } catch (error) {
    console.error("Auth callback database error:", error);
    return NextResponse.redirect(`${errorRedirect}server_error`);
  }
}
