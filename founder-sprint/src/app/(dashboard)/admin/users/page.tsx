import { getBatches } from "@/actions/batch";
import { UserManagement } from "./UserManagement";

export default async function AdminUsersPage() {
  const batches = await getBatches();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">User Management</h1>
      </div>
      <UserManagement batches={batches.map((b: { id: string; name: string; status: string; endDate: Date }) => ({ id: b.id, name: b.name, status: b.status, endDate: b.endDate }))} />
    </div>
  );
}
