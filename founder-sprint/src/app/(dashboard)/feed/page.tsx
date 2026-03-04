import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getPaginatedPosts, getArchivedPosts, getUserLikedPostIds } from "@/actions/feed";
import { getUserBookmarkedPostIds } from "@/actions/bookmark";
import { getFollowingIdsForUser, getFollowSuggestions } from "@/actions/follow";
import { FeedView } from "./FeedView";
import { PeopleToFollow } from "@/components/feed/PeopleToFollow";
import { Pagination } from "@/components/ui/Pagination";
import DashboardShell from "@/components/layout/DashboardShell";

export const revalidate = 30;

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ page?: string; tab?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const tab = params.tab || 'top';
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const isAdmin = user.role === "super_admin" || user.role === "admin";

  const [paginatedPosts, archivedPosts, followSuggestions, followingIds] = await Promise.all([
    getPaginatedPosts(page),
    isAdmin ? getArchivedPosts() : Promise.resolve([]),
    getFollowSuggestions(8),
    getFollowingIdsForUser(user.id),
  ]);

  const postIds = paginatedPosts.items.map((p) => p.id);
  const [likedPostIds, bookmarkedPostIds] = await Promise.all([
    getUserLikedPostIds(postIds),
    getUserBookmarkedPostIds(postIds),
  ]);

  return (
    <DashboardShell
      rightSidebar={
        <PeopleToFollow
          suggestions={followSuggestions}
          currentUserId={user.id}
        />
      }
    >
      <FeedView
        posts={paginatedPosts.items}
        archivedPosts={archivedPosts}
        currentUser={user}
        isAdmin={isAdmin}
        initialTab={tab}
        likedPostIds={likedPostIds}
        bookmarkedPostIds={bookmarkedPostIds}
      />
      <Pagination
        currentPage={paginatedPosts.page}
        totalPages={paginatedPosts.totalPages}
        basePath="/feed"
      />
    </DashboardShell>
  );
}
