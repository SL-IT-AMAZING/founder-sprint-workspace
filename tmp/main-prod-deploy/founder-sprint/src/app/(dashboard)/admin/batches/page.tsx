import { getBatches } from "@/actions/batch";
import { BatchList } from "./BatchList";

export default async function AdminBatchesPage() {
  const batches = await getBatches();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>Batch Management</h1>
      </div>
      <BatchList batches={batches} />
    </div>
  );
}
