"use client";

import { useState, useTransition } from "react";
import { deleteCompany } from "@/actions/company";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Company {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  industry: string | null;
  hqLocation: string | null;
  foundedYear: number | null;
  logoUrl: string | null;
  tags: string[];
  memberCount: number;
  memberAvatars: Array<string | null>;
}

interface CompanyListProps {
  initialCompanies: Company[];
}

export function CompanyList({ initialCompanies }: CompanyListProps) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const result = await deleteCompany(id);
      
      if (result.success) {
        setCompanies(companies.filter(c => c.id !== id));
        setConfirmDelete(null);
        router.refresh();
      }
    });
  };

  if (companies.length === 0) {
    return (
      <EmptyState
        title="No companies yet"
        description="Create your first company to get started"
        action={
          <Link href="/admin/companies/new">
            <Button>Add Company</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">All Companies ({companies.length})</h2>
          <Link href="/admin/companies/new">
            <Button>Add Company</Button>
          </Link>
        </div>

        {/* Mobile view */}
        <div className="md:hidden space-y-4">
          {companies.map((company) => (
            <div
              key={company.id}
              style={{
                padding: "16px",
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #e0e0e0",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
              }}
            >
              <div className="flex items-start gap-3 mb-3">
                <Avatar
                  src={company.logoUrl}
                  name={company.name}
                  size={48}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate" style={{ color: "#2F2C26" }}>
                    {company.name}
                  </h3>
                  {company.industry && (
                    <p className="text-sm" style={{ color: "#666" }}>
                      {company.industry}
                    </p>
                  )}
                  {company.hqLocation && (
                    <p className="text-sm" style={{ color: "#666" }}>
                      {company.hqLocation}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid #e0e0e0" }}>
                <span className="text-sm" style={{ color: "#666" }}>
                  {company.memberCount} {company.memberCount === 1 ? 'member' : 'members'}
                </span>
                <div className="flex gap-2">
                  <Link href={`/admin/companies/${company.id}/edit`}>
                    <Button size="sm">Edit</Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setConfirmDelete({ id: company.id, name: company.name })}
                    disabled={isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop view */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "#666" }}>
                  Company
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "#666" }}>
                  Industry
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "#666" }}>
                  Location
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: "#666" }}>
                  Members
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium" style={{ color: "#666" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr
                  key={company.id}
                  style={{ borderBottom: "1px solid #e0e0e0" }}
                >
                  <td className="py-3 px-4">
                    <Link 
                      href={`/admin/companies/${company.id}/edit`}
                      className="flex items-center gap-3 hover:opacity-80"
                    >
                      <Avatar
                        src={company.logoUrl}
                        name={company.name}
                        size={40}
                      />
                      <div className="min-w-0">
                        <div className="font-medium" style={{ color: "#2F2C26" }}>
                          {company.name}
                        </div>
                        {company.description && (
                          <div className="text-sm truncate" style={{ color: "#666", maxWidth: "300px" }}>
                            {company.description}
                          </div>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <span style={{ color: "#2F2C26" }}>
                      {company.industry || "-"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span style={{ color: "#2F2C26" }}>
                      {company.hqLocation || "-"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {company.memberAvatars.slice(0, 3).map((avatar, i) => (
                          <div
                            key={i}
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              border: "2px solid #FFFFFF",
                              backgroundColor: "#e0e0e0",
                              overflow: "hidden"
                            }}
                          >
                            {avatar && (
                              <img src={avatar} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                        ))}
                      </div>
                      <span className="text-sm" style={{ color: "#666" }}>
                        {company.memberCount}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/companies/${company.id}/edit`}>
                        <Button size="sm">Edit</Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setConfirmDelete({ id: company.id, name: company.name })}
                        disabled={isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Company"
      >
        <div className="space-y-4">
          <p style={{ color: "#666" }}>
            Are you sure you want to delete <strong>{confirmDelete?.name}</strong>?
            This action cannot be undone.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setConfirmDelete(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => confirmDelete && handleDelete(confirmDelete.id)}
              loading={isPending}
            >
              Delete Company
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
