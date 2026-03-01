import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/permissions";
import { searchCompanies, searchPosts, searchUsers } from "@/lib/search-service";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const type = searchParams.get("type") || "all";

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ posts: [], users: [], companies: [] });
  }

  const batchId = user.batchId;

  if (type === "posts") {
    const posts = await searchPosts(query, batchId, 10);
    return NextResponse.json({ posts, users: [], companies: [] });
  }

  if (type === "users") {
    const users = await searchUsers(query, batchId, 5);
    return NextResponse.json({ posts: [], users, companies: [] });
  }

  if (type === "companies") {
    const companies = await searchCompanies(query, 5);
    return NextResponse.json({ posts: [], users: [], companies });
  }

  const [posts, users, companies] = await Promise.all([
    searchPosts(query, batchId, 8),
    searchUsers(query, batchId, 3),
    searchCompanies(query, 3),
  ]);

  return NextResponse.json({ posts, users, companies });
}
