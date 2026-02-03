import { redirect } from "next/navigation";
import { getCurrentUser, isStaff } from "@/lib/permissions";

export const revalidate = 60;
import { getSubmissions } from "@/actions/assignment";
import { SubmissionsDashboard } from "./SubmissionsDashboard";

export default async function SubmissionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!isStaff(user.role)) {
    redirect("/assignments");
  }

  const submissions = await getSubmissions(user.batchId);

  return <SubmissionsDashboard submissions={submissions} />;
}
