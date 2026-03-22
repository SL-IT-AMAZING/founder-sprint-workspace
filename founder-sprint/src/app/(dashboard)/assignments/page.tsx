import { redirect } from "next/navigation";
import { getCurrentUser, isStaff, isAdmin } from "@/lib/permissions";
import { getAssignments, getAssignmentTemplates } from "@/actions/assignment";
import { getActiveBatches } from "@/actions/batch";
import { getCompaniesForBatch } from "@/actions/company";
import { AssignmentsList } from "./AssignmentsList";

export const revalidate = 60;

export default async function AssignmentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const userIsAdmin = isAdmin(user.role);
  const [assignments, batches, templates, companies] = await Promise.all([
    userIsAdmin ? getAssignments() : getAssignments(user.batchId),
    userIsAdmin ? getActiveBatches() : Promise.resolve([]),
    getAssignmentTemplates(),
    getCompaniesForBatch(user.batchId),
  ]);

  return (
    <AssignmentsList
      assignments={assignments}
      canCreate={isStaff(user.role)}
      isAdmin={userIsAdmin}
      batches={batches}
      currentBatchId={user.batchId}
      availableCompanies={companies.map((company) => ({ id: company.id, name: company.name, memberCount: company._count.members }))}
      templates={templates}
    />
  );
}
