import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/permissions";
import { getAccessibleActiveUsers } from "@/lib/user-access";

export async function GET(request: NextRequest) {
  const viewer = await getCurrentUser();
  if (!viewer) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (query.length < 1) {
    return NextResponse.json({ users: [] });
  }

  const users = await getAccessibleActiveUsers(viewer, {
    query,
    limit: 8,
    excludeSelf: true,
  });

  return NextResponse.json({ users });
}
