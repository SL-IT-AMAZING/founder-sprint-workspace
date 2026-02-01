import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getGroup } from "@/actions/group";
import { GroupDetail } from "./GroupDetail";

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const group = await getGroup(id);
  if (!group) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl">Group not found</h1>
      </div>
    );
  }

  return <GroupDetail group={group} currentUserId={user.id} currentUser={user} />;
}
