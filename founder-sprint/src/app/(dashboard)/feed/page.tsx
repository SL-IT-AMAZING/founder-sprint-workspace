import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getPaginatedPosts, getArchivedPosts } from "@/actions/feed";
import { getFollowingIdsForUser } from "@/actions/follow";
import { getBatchUsers } from "@/actions/user-management";
import { isBatchActive } from "@/lib/batch-utils";
import { FeedView } from "./FeedView";
import { BatchMembersSidebar } from "@/components/feed/BatchMembersSidebar";
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

  const [paginatedPosts, archivedPosts, batchMembers, followingIds] = await Promise.all([
    getPaginatedPosts(user.batchId, page),
    isAdmin ? getArchivedPosts(user.batchId) : Promise.resolve([]),
    getBatchUsers(user.batchId),
    getFollowingIdsForUser(user.id),
  ]);

  return (
    <DashboardShell
      rightSidebar={
        <BatchMembersSidebar
          members={batchMembers}
          batchName={user.batchName || ""}
          batchStatus={user.batchStatus}
          batchEndDate={user.batchEndDate}
          currentUserId={user.id}
          followingIds={followingIds}
        />
      }
    >
      <FeedView
        posts={paginatedPosts.items}
        archivedPosts={archivedPosts}
        currentUser={user}
        isAdmin={isAdmin}
        initialTab={tab}
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
