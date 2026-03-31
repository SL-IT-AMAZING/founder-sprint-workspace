import { prisma } from "@/lib/prisma";
import { classifyAvatarSource } from "@/lib/avatar-source";
import { ingestLinkedInAvatar } from "@/lib/linkedin-avatar-ingest";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { profileImage: { not: null } },
    select: { id: true, profileImage: true },
  });

  const eligible = users.filter(
    (u) => classifyAvatarSource(u.profileImage) === "linkedin"
  );

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const user of eligible) {
    processed++;
    try {
      const url = await ingestLinkedInAvatar(user.id, user.profileImage!);
      if (url) {
        await prisma.user.update({
          where: { id: user.id },
          data: { profileImage: url },
        });
        succeeded++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ processed, succeeded, failed });
}
