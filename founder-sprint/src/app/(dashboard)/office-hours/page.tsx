import { getCurrentUser } from "@/lib/permissions";
import { getOfficeHourSlots } from "@/actions/office-hour";
import { getGroups } from "@/actions/group";
import { redirect } from "next/navigation";
import { OfficeHoursList } from "./OfficeHoursList";

export const revalidate = 60;

export default async function OfficeHoursPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const slots = await getOfficeHourSlots(user.batchId, user.id, user.role);
  const groups = await getGroups(user.batchId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Office Hours</h1>
      </div>
      <OfficeHoursList user={user} slots={slots} groups={groups} />
    </div>
  );
}
