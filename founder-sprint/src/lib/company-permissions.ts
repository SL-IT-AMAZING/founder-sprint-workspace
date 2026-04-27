import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin, isFounder } from "@/lib/permissions";

type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>;

export type CompanyManagerAuthorization = {
  user: NonNullable<CurrentUser>;
  isAdmin: boolean;
  isCompanyFounder: boolean;
};

export async function requireCompanyManager(
  companyId: string
): Promise<{ success: false; error: string } | ({ success: true } & CompanyManagerAuthorization)> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (isAdmin(user)) {
    return { success: true, user, isAdmin: true, isCompanyFounder: false };
  }

  if (!isFounder(user)) {
    return { success: false, error: "Not authorized" };
  }

  const membership = await prisma.companyMember.findFirst({
    where: {
      companyId,
      userId: user.id,
      isCurrent: true,
    },
    select: { id: true },
  });

  if (!membership) return { success: false, error: "Not authorized" };

  return { success: true, user, isAdmin: false, isCompanyFounder: true };
}

export function canManageCompanyFromMembers(
  user: NonNullable<CurrentUser>,
  members: Array<{ isCurrent: boolean; user: { id: string } }>
) {
  return isAdmin(user) || (isFounder(user) && members.some((member) => member.isCurrent && member.user.id === user.id));
}
