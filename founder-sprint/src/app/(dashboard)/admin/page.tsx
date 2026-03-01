import { Suspense } from "react";
import { getBatches } from "@/actions/batch";
import { getCompaniesDirectory } from "@/actions/directory";
import { AdminView } from "./AdminView";

export const revalidate = 30;

export default async function AdminPage() {
  const [batches, companiesResult] = await Promise.all([
    getBatches(),
    getCompaniesDirectory({}),
  ]);

  const companies = companiesResult.success ? companiesResult.data.companies : [];

  return (
    <Suspense>
      <AdminView batches={batches} companies={companies} />
    </Suspense>
  );
}
