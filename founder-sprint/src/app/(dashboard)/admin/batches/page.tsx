import { getBatches } from "@/actions/batch";
import { BatchList } from "./BatchList";

export default async function AdminBatchesPage() {
  const batches = await getBatches();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif">Batch Management</h1>
      </div>
      <BatchList batches={batches} />
    </div>
  );
}
