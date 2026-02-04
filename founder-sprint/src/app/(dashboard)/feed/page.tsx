import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getPosts, getArchivedPosts, getPostsForBatches } from "@/actions/feed";
import { getBatchUsers } from "@/actions/user-management";
import { getUserBatches } from "@/actions/batch-switcher";
import { isBatchActive } from "@/lib/batch-utils";
import { FeedView } from "./FeedView";
import { BatchMembersSidebar } from "@/components/feed/BatchMembersSidebar";

export const revalidate = 30;

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isAdmin = user.role === "super_admin" || user.role === "admin";

  // Get user's batches for multi-batch tab support
  const batchResult = await getUserBatches();
  const userBatches = batchResult.success ? batchResult.data : [];
  const batchIds = userBatches.map((b) => b.batchId);

  const [posts, archivedPosts, batchMembers] = await Promise.all([
    batchIds.length > 1
      ? getPostsForBatches(batchIds)
      : getPosts(user.batchId),
    isAdmin ? getArchivedPosts(user.batchId) : Promise.resolve([]),
    getBatchUsers(user.batchId),
  ]);

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <FeedView
          posts={posts}
          archivedPosts={archivedPosts}
          currentUser={user}
          isAdmin={isAdmin}
          batches={userBatches.length > 1 ? userBatches : undefined}
          readOnly={user.batchEndDate && user.batchStatus ? !isBatchActive({ status: user.batchStatus, endDate: user.batchEndDate }) : false}
        />
      </div>
      <div className="hidden lg:block w-64 shrink-0">
        <BatchMembersSidebar
          members={batchMembers}
          batches={userBatches}
          currentBatchId={user.batchId}
        />
      </div>
    </div>
  );
}
