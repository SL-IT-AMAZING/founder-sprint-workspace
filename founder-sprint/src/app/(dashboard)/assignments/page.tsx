import { redirect } from "next/navigation";
import { getCurrentUser, isStaff } from "@/lib/permissions";
import { getAssignments } from "@/actions/assignment";
import { AssignmentsList } from "./AssignmentsList";

export const revalidate = 60;

export default async function AssignmentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const assignments = await getAssignments(user.batchId);

  return <AssignmentsList assignments={assignments} canCreate={isStaff(user.role)} />;
}
