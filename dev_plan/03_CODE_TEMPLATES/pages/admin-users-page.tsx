'use client';

import { useState, useActionState } from 'react';
import { PageHeader } from '../components/page-header';
import { Card, CardBody, CardFooter } from '../components/card';
import { Button, SubmitButton } from '../components/button';
import { Input, Select } from '../components/input';
import { Badge, StatusBadge } from '../components/badge';
import { Avatar } from '../components/avatar';
import { Modal } from '../components/modal';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: 'founder' | 'mentor' | 'admin';
  cohortId?: string;
  cohortName?: string;
  status: 'active' | 'pending' | 'suspended';
  linkedinUrl?: string;
  createdAt: Date;
}

interface Cohort {
  id: string;
  name: string;
}

interface AdminUsersPageProps {
  users: User[];
  cohorts: Cohort[];
  inviteUser: (formData: FormData) => Promise<{ error?: string }>;
  updateUser: (formData: FormData) => Promise<{ error?: string }>;
  suspendUser: (userId: string) => Promise<{ error?: string }>;
  activateUser: (userId: string) => Promise<{ error?: string }>;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function UserRow({
  user,
  onEdit,
  onSuspend,
  onActivate,
}: {
  user: User;
  onEdit: () => void;
  onSuspend: () => void;
  onActivate: () => void;
}) {
  const roleBadge = {
    founder: <Badge size="sm">Founder</Badge>,
    mentor: <Badge size="sm" variant="info">Mentor</Badge>,
    admin: <Badge size="sm" variant="warning">Admin</Badge>,
  }[user.role];

  return (
    <tr className="border-b border-[#2f2c251f] last:border-0">
      <td className="py-4 pr-4">
        <div className="flex items-center gap-3">
          <Avatar src={user.avatarUrl} name={user.name} size="sm" />
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-[11px] text-[#00000080]">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="py-4 pr-4">
        {roleBadge}
      </td>
      <td className="py-4 pr-4">
        {user.cohortName || '-'}
      </td>
      <td className="py-4 pr-4">
        <StatusBadge status={user.status} size="sm" />
      </td>
      <td className="py-4 pr-4 text-sm text-[#00000080]">
        {formatDate(user.createdAt)}
      </td>
      <td className="py-4">
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="small" onClick={onEdit}>
            Edit
          </Button>
          {user.status === 'active' ? (
            <Button variant="outline" size="small" onClick={onSuspend}>
              Suspend
            </Button>
          ) : user.status === 'suspended' ? (
            <Button variant="outline" size="small" onClick={onActivate}>
              Activate
            </Button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

export function AdminUsersPage({
  users,
  cohorts,
  inviteUser,
  updateUser,
  suspendUser,
  activateUser,
}: AdminUsersPageProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [inviteState, inviteAction, invitePending] = useActionState(
    async (_: unknown, formData: FormData) => {
      const result = await inviteUser(formData);
      if (!result.error) {
        setShowInviteModal(false);
      }
      return result;
    },
    { error: undefined }
  );

  const [updateState, updateAction, updatePending] = useActionState(
    async (_: unknown, formData: FormData) => {
      const result = await updateUser(formData);
      if (!result.error) {
        setEditingUser(null);
      }
      return result;
    },
    { error: undefined }
  );

  const filteredUsers = users.filter((u) => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (roleFilter !== 'all' && u.role !== roleFilter) {
      return false;
    }
    if (statusFilter !== 'all' && u.status !== statusFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Users"
        description="Manage founders, mentors, and administrators"
        actions={
          <Button onClick={() => setShowInviteModal(true)}>
            Invite User
          </Button>
        }
      />

      <Card>
        <CardBody className="pt-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-36">
              <Select
                options={[
                  { value: 'all', label: 'All Roles' },
                  { value: 'founder', label: 'Founders' },
                  { value: 'mentor', label: 'Mentors' },
                  { value: 'admin', label: 'Admins' },
                ]}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              />
            </div>
            <div className="w-36">
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'suspended', label: 'Suspended' },
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2f2c251f]">
                <th className="py-3 pr-4 text-left text-[11px] font-mono font-medium uppercase tracking-[0.1em] text-[#00000080]">
                  User
                </th>
                <th className="py-3 pr-4 text-left text-[11px] font-mono font-medium uppercase tracking-[0.1em] text-[#00000080]">
                  Role
                </th>
                <th className="py-3 pr-4 text-left text-[11px] font-mono font-medium uppercase tracking-[0.1em] text-[#00000080]">
                  Cohort
                </th>
                <th className="py-3 pr-4 text-left text-[11px] font-mono font-medium uppercase tracking-[0.1em] text-[#00000080]">
                  Status
                </th>
                <th className="py-3 pr-4 text-left text-[11px] font-mono font-medium uppercase tracking-[0.1em] text-[#00000080]">
                  Joined
                </th>
                <th className="py-3 text-right text-[11px] font-mono font-medium uppercase tracking-[0.1em] text-[#00000080]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onEdit={() => setEditingUser(user)}
                  onSuspend={() => suspendUser(user.id)}
                  onActivate={() => activateUser(user.id)}
                />
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="py-12 text-center text-[#00000080]">
              No users found matching your criteria.
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite User"
        size="md"
      >
        <form action={inviteAction}>
          <div className="flex flex-col gap-4">
            <Input
              label="Email"
              name="email"
              type="email"
              required
              placeholder="user@example.com"
            />
            <Input
              label="Name"
              name="name"
              required
              placeholder="John Doe"
            />
            <Select
              label="Role"
              name="role"
              options={[
                { value: 'founder', label: 'Founder' },
                { value: 'mentor', label: 'Mentor' },
                { value: 'admin', label: 'Admin' },
              ]}
            />
            <Select
              label="Cohort"
              name="cohortId"
              options={[
                { value: '', label: 'No Cohort' },
                ...cohorts.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            {inviteState.error && (
              <p className="text-sm text-[#ea384c]">{inviteState.error}</p>
            )}
            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                Cancel
              </Button>
              <SubmitButton pending={invitePending}>
                Send Invite
              </SubmitButton>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit User"
        size="md"
      >
        {editingUser && (
          <form action={updateAction}>
            <input type="hidden" name="userId" value={editingUser.id} />
            <div className="flex flex-col gap-4">
              <Input
                label="Name"
                name="name"
                required
                defaultValue={editingUser.name}
              />
              <Select
                label="Role"
                name="role"
                defaultValue={editingUser.role}
                options={[
                  { value: 'founder', label: 'Founder' },
                  { value: 'mentor', label: 'Mentor' },
                  { value: 'admin', label: 'Admin' },
                ]}
              />
              <Select
                label="Cohort"
                name="cohortId"
                defaultValue={editingUser.cohortId || ''}
                options={[
                  { value: '', label: 'No Cohort' },
                  ...cohorts.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
              {updateState.error && (
                <p className="text-sm text-[#ea384c]">{updateState.error}</p>
              )}
              <div className="flex gap-3 justify-end pt-4">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <SubmitButton pending={updatePending}>
                  Save Changes
                </SubmitButton>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default AdminUsersPage;
