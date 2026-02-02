import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getPosts } from "@/actions/feed";
import { FeedView } from "./FeedView";

export const revalidate = 30;

export default async function FeedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const posts = await getPosts(user.batchId);

  return <FeedView posts={posts} currentUser={user} />;
}
