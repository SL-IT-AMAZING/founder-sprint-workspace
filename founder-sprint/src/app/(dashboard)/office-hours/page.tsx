import { getCurrentUser } from "@/lib/permissions";
import { completeExpiredSlots, getOfficeHourSlots } from "@/actions/office-hour";
import { getGroups } from "@/actions/group";
import { redirect } from "next/navigation";
import { OfficeHoursList } from "./OfficeHoursList";

export const revalidate = 60;

export default async function OfficeHoursPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  await completeExpiredSlots(user.batchId);
  const slots = await getOfficeHourSlots(user.batchId, user.id, user.role);
  const groups = await getGroups(user.batchId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>Office Hours</h1>
      </div>
      <OfficeHoursList user={user} slots={slots} groups={groups} />
    </div>
  );
}
