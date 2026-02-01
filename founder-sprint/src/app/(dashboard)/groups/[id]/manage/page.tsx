import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { getGroup } from "@/actions/group";
import { GroupManage } from "./GroupManage";

export default async function GroupManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!isAdmin(user.role)) {
    redirect(`/groups/${id}`);
  }

  const group = await getGroup(id);
  if (!group) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl">Group not found</h1>
      </div>
    );
  }

  return <GroupManage group={group} />;
}
