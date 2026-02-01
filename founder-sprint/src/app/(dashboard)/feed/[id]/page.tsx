import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getPost } from "@/actions/feed";
import { PostDetail } from "./PostDetail";

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const post = await getPost(id);
  if (!post) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl">Post not found</h1>
      </div>
    );
  }

  return <PostDetail post={post} currentUser={user} />;
}
