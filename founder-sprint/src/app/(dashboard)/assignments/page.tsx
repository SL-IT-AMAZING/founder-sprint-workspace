import { redirect } from "next/navigation";
import { getCurrentUser, isStaff, isAdmin } from "@/lib/permissions";
import { getAssignments } from "@/actions/assignment";
import { getActiveBatches } from "@/actions/batch";
import { AssignmentsList } from "./AssignmentsList";

export const revalidate = 60;

export default async function AssignmentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const userIsAdmin = isAdmin(user.role);
  const [assignments, batches] = await Promise.all([
    userIsAdmin ? getAssignments() : getAssignments(user.batchId),
    userIsAdmin ? getActiveBatches() : Promise.resolve([]),
  ]);

  return (
    <AssignmentsList
      assignments={assignments}
      canCreate={isStaff(user.role)}
      isAdmin={userIsAdmin}
      batches={batches}
      currentBatchId={user.batchId}
    />
  );
}
