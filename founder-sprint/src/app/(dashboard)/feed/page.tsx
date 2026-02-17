import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getPosts, getArchivedPosts } from "@/actions/feed";
import { getBatchUsers } from "@/actions/user-management";
import { isBatchActive } from "@/lib/batch-utils";
import { FeedView } from "./FeedView";
import { BatchMembersSidebar } from "@/components/feed/BatchMembersSidebar";

export const revalidate = 30;

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isAdmin = user.role === "super_admin" || user.role === "admin";

  const [posts, archivedPosts, batchMembers] = await Promise.all([
    getPosts(user.batchId),
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
          readOnly={user.batchEndDate && user.batchStatus ? !isBatchActive({ status: user.batchStatus, endDate: user.batchEndDate }) : false}
        />
      </div>
      <div className="hidden lg:block w-64 shrink-0">
        <BatchMembersSidebar
          members={batchMembers}
          batchName={user.batchName || ""}
          batchStatus={user.batchStatus}
          batchEndDate={user.batchEndDate}
        />
      </div>
    </div>
  );
}
