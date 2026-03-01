import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getPaginatedPosts, getArchivedPosts } from "@/actions/feed";
import { getFollowingIdsForUser, getFollowSuggestions } from "@/actions/follow";
import { isBatchActive } from "@/lib/batch-utils";
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
    getPaginatedPosts(user.batchId, page),
    isAdmin ? getArchivedPosts(user.batchId) : Promise.resolve([]),
    getFollowSuggestions(8),
    getFollowingIdsForUser(user.id),
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
        batchName={user.batchName || ""}
        readOnly={user.batchEndDate && user.batchStatus ? !isBatchActive({ status: user.batchStatus, endDate: user.batchEndDate }) : false}
      />
      <Pagination
        currentPage={paginatedPosts.page}
        totalPages={paginatedPosts.totalPages}
        basePath="/feed"
      />
    </DashboardShell>
  );
}
