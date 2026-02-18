import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getPaginatedPosts, getArchivedPosts } from "@/actions/feed";
import { getBatchUsers } from "@/actions/user-management";
import { isBatchActive } from "@/lib/batch-utils";
import { FeedView } from "./FeedView";
import { BatchMembersSidebar } from "@/components/feed/BatchMembersSidebar";
import { Pagination } from "@/components/ui/Pagination";

export const revalidate = 30;

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const isAdmin = user.role === "super_admin" || user.role === "admin";

  const [paginatedPosts, archivedPosts, batchMembers] = await Promise.all([
    getPaginatedPosts(user.batchId, page),
    isAdmin ? getArchivedPosts(user.batchId) : Promise.resolve([]),
    getBatchUsers(user.batchId),
  ]);

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <FeedView
          posts={paginatedPosts.items}
          archivedPosts={archivedPosts}
          currentUser={user}
          isAdmin={isAdmin}
          readOnly={user.batchEndDate && user.batchStatus ? !isBatchActive({ status: user.batchStatus, endDate: user.batchEndDate }) : false}
        />
        <Pagination
          currentPage={paginatedPosts.page}
          totalPages={paginatedPosts.totalPages}
          basePath="/feed"
        />
      </div>
       <div className="hidden lg:block w-64 shrink-0">
         <BatchMembersSidebar
           members={batchMembers}
           batchName={user.batchName || ""}
           batchStatus={user.batchStatus}
           batchEndDate={user.batchEndDate}
           currentUserId={user.id}
         />
       </div>
    </div>
  );
}
