import { redirect } from "next/navigation";
import { getCurrentUser, isStaff, isAdmin } from "@/lib/permissions";

export const revalidate = 60;
import { getSubmissions } from "@/actions/assignment";
import { SubmissionsDashboard } from "./SubmissionsDashboard";

export default async function SubmissionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!isStaff(user.role)) {
    redirect("/assignments");
  }

  // Admin sees all batches, staff sees their batch only
  const submissions = isAdmin(user.role)
    ? await getSubmissions()
    : await getSubmissions(user.batchId);

  return <SubmissionsDashboard submissions={submissions} />;
}
