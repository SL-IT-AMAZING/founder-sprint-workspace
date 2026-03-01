import { getBatches } from "@/actions/batch";
import { UserManagement } from "./UserManagement";

export default async function AdminUsersPage() {
  const batches = await getBatches();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>User Management</h1>
      </div>
      <UserManagement batches={batches.map((b: { id: string; name: string; status: string; endDate: Date }) => ({ id: b.id, name: b.name, status: b.status, endDate: b.endDate }))} />
    </div>
  );
}
