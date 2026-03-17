import { redirect } from "next/navigation";
import { getCurrentUser, isStaff, isAdmin } from "@/lib/permissions";
import { getAssignments, getAssignmentTargetOptions, getAssignmentTemplates } from "@/actions/assignment";
import { getActiveBatches } from "@/actions/batch";
import { AssignmentsList } from "./AssignmentsList";

export const revalidate = 60;

export default async function AssignmentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const userIsAdmin = isAdmin(user.role);
  const [assignments, batches, targetOptions, templates] = await Promise.all([
    userIsAdmin ? getAssignments() : getAssignments(user.batchId),
    userIsAdmin ? getActiveBatches() : Promise.resolve([]),
    getAssignmentTargetOptions(user.batchId),
    getAssignmentTemplates(),
  ]);

  return (
    <AssignmentsList
      assignments={assignments}
      canCreate={isStaff(user.role)}
      isAdmin={userIsAdmin}
      batches={batches}
      currentBatchId={user.batchId}
      availableGroups={targetOptions.groups}
      availableUsers={targetOptions.users}
      templates={templates}
    />
  );
}
