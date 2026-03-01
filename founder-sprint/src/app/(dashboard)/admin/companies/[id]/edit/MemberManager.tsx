"use client";

import { useState, useTransition } from "react";
import { addCompanyMember, removeCompanyMember } from "@/actions/company";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  role: string | null;
  title: string | null;
  isCurrent: boolean;
  user: {
    id: string;
    name: string | null;
    email: string;
    profileImage: string | null;
  };
}

interface MemberManagerProps {
  companyId: string;
  members: Member[];
}

export function MemberManager({ companyId, members: initialMembers }: MemberManagerProps) {
  const [members, setMembers] = useState(initialMembers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<{ id: string; name: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string | null; email: string; profileImage: string | null }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError("");

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      } else {
        setError("Failed to search users");
      }
    } catch (err) {
      setError("Failed to search users");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const userId = formData.get("userId") as string;
    const role = formData.get("role") as string;
    const title = formData.get("title") as string;

    if (!userId) {
      setError("Please select a user");
      return;
    }

    startTransition(async () => {
      const result = await addCompanyMember(
        companyId,
        userId,
        role || undefined,
        title || undefined
      );

      if (result.success) {
        setIsAddModalOpen(false);
        setSearchQuery("");
        setSearchResults([]);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const handleRemoveMember = async (memberId: string) => {
    startTransition(async () => {
      const result = await removeCompanyMember(memberId);

      if (result.success) {
        setMembers(members.filter(m => m.id !== memberId));
        setConfirmRemove(null);
        router.refresh();
      }
    });
  };

  const currentMembers = members.filter(m => m.isCurrent);

  return (
    <div className="card" style={{ maxWidth: "800px" }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Team Members ({currentMembers.length})</h2>
        <Button onClick={() => setIsAddModalOpen(true)}>
          Add Member
        </Button>
      </div>

      {currentMembers.length === 0 ? (
        <EmptyState
          title="No team members yet"
          description="Add team members to this company"
        />
      ) : (
        <div className="space-y-3">
          {currentMembers.map((member) => (
            <div
              key={member.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #e0e0e0"
              }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar
                  src={member.user.profileImage}
                  name={member.user.name || member.user.email}
                  size={40}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate" style={{ color: "#2F2C26" }}>
                    {member.user.name || member.user.email}
                  </div>
                  <div className="text-sm truncate" style={{ color: "#666" }}>
                    {member.title && member.role 
                      ? `${member.title} • ${member.role}`
                      : member.title || member.role || member.user.email}
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                variant="danger"
                onClick={() => setConfirmRemove({ 
                  id: member.id, 
                  name: member.user.name || member.user.email 
                })}
                disabled={isPending}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setError("");
          setSearchQuery("");
          setSearchResults([]);
        }}
        title="Add Team Member"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#2F2C26" }}>
              Search User
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleSearch}
                loading={isSearching}
                disabled={!searchQuery.trim()}
              >
                Search
              </Button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#2F2C26" }}>
                Select User
              </label>
              <div
                style={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px"
                }}
              >
                {searchResults.map((user) => (
                  <label
                    key={user.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 12px",
                      cursor: "pointer",
                      borderBottom: "1px solid #e0e0e0"
                    }}
                    className="hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="userId"
                      value={user.id}
                      style={{ cursor: "pointer" }}
                    />
                    <Avatar
                      src={user.profileImage}
                      name={user.name || user.email}
                      size={32}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate" style={{ color: "#2F2C26" }}>
                        {user.name || user.email}
                      </div>
                      {user.name && (
                        <div className="text-xs truncate" style={{ color: "#666" }}>
                          {user.email}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <Input
            label="Role (Optional)"
            name="role"
            type="text"
            placeholder="e.g., CEO, CTO, Developer"
          />

          <Input
            label="Title (Optional)"
            name="title"
            type="text"
            placeholder="e.g., Co-Founder, Head of Engineering"
          />

          {error && (
            <div 
              className="p-3 rounded-lg text-sm"
              style={{
                backgroundColor: "#fee2e2",
                border: "1px solid #fecaca",
                color: "#991b1b"
              }}
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsAddModalOpen(false);
                setError("");
                setSearchQuery("");
                setSearchResults([]);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              Add Member
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        title="Remove Member"
      >
        <div className="space-y-4">
          <p style={{ color: "#666" }}>
            Are you sure you want to remove <strong>{confirmRemove?.name}</strong> from this company?
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setConfirmRemove(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => confirmRemove && handleRemoveMember(confirmRemove.id)}
              loading={isPending}
            >
              Remove Member
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
