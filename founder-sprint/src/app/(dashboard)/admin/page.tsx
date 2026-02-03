import { getBatches } from "@/actions/batch";
import { AdminView } from "./AdminView";

export const revalidate = 30;

export default async function AdminPage() {
  const batches = await getBatches();

  return <AdminView batches={batches} />;
}
