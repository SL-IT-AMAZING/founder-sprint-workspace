import { Suspense } from "react";
import { getBatches } from "@/actions/batch";
import { getCompaniesDirectory } from "@/actions/directory";
import { getCurrentUser } from "@/lib/permissions";
import { AdminView } from "./AdminView";

export const revalidate = 30;

export default async function AdminPage() {
  const [user, batches, companiesResult] = await Promise.all([
    getCurrentUser(),
    getBatches(),
    getCompaniesDirectory({}),
  ]);

  const companies = companiesResult.success ? companiesResult.data.companies : [];

  return (
    <Suspense>
      <AdminView batches={batches} companies={companies} canAssignSuperAdmin={user?.role === "super_admin"} />
    </Suspense>
  );
}
