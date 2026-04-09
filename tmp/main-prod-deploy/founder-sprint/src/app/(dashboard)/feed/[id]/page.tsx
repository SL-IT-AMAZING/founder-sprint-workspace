import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getPostById, getConversationParticipants } from "@/actions/post-detail";
import { checkIsBookmarked } from "@/actions/bookmark";
import { PostDetailClient } from "./PostDetailClient";
export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const [post, participants] = await Promise.all([
    getPostById(id),
    getConversationParticipants(id),
  ]);

  if (!post) notFound();

  const isLiked = post.likes.some((like: { userId: string }) => like.userId === user.id);
  const isBookmarked = post.bookmarks.length > 0;
  const isAdmin = user.role === "super_admin" || user.role === "admin";
    return (
    <div>
      <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-6">
        <PostDetailClient
          post={post}
          currentUser={user}
          isLiked={isLiked}
          isBookmarked={isBookmarked}
          isAdmin={isAdmin}
          participants={participants}
        />
      </div>
    </div>
  );
}
