import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { canManageCompanyFromMembers } from "@/lib/company-permissions";
import { prisma } from "@/lib/prisma";
import { getBatches } from "@/actions/batch";
import { CompanyForm } from "@/app/(dashboard)/admin/companies/new/CompanyForm";
import { MemberManager } from "@/app/(dashboard)/admin/companies/[id]/edit/MemberManager";

interface ManageCompanyPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ManageCompanyPage({ params }: ManageCompanyPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { slug } = await params;
  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
            },
          },
        },
        orderBy: [{ isCurrent: "desc" }, { createdAt: "asc" }],
      },
      batches: {
        select: { batchId: true },
      },
    },
  });

  if (!company) {
    notFound();
  }

  if (!canManageCompanyFromMembers(user, company.members)) {
    redirect("/dashboard");
  }

  const userIsAdmin = isAdmin(user);
  const allBatches = userIsAdmin ? await getBatches() : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>Manage Company</h1>
          <p className="text-sm mt-1" style={{ color: "#666" }}>
            {userIsAdmin ? "Update company information and manage team members" : "Update company profile information"}
          </p>
        </div>
        <Link href={`/companies/${company.slug}`} className="text-sm underline" style={{ color: "#2F2C26" }}>
          Back to company
        </Link>
      </div>

      <CompanyForm
        initialData={{
          id: company.id,
          name: company.name,
          slug: company.slug,
          description: company.description,
          website: company.website,
          industry: company.industry,
          hqLocation: company.hqLocation,
          foundedYear: company.foundedYear,
          logoUrl: company.logoUrl,
          tags: company.tags,
        }}
        batches={allBatches.map((batch) => ({ id: batch.id, name: batch.name }))}
        initialBatchIds={company.batches.map((companyBatch) => companyBatch.batchId)}
        canManageBatches={userIsAdmin}
        successRedirect="companyProfile"
      />

      {userIsAdmin ? (
        <MemberManager
          companyId={company.id}
          members={company.members.map((member) => ({
            id: member.id,
            role: member.role,
            title: member.title,
            isCurrent: member.isCurrent,
            user: {
              id: member.user.id,
              name: member.user.name,
              email: member.user.email,
              profileImage: member.user.profileImage,
            },
          }))}
        />
      ) : (
        <div className="card" style={{ maxWidth: "800px" }}>
          <h2 className="text-lg font-semibold mb-2">Team Members</h2>
          <p className="text-sm" style={{ color: "#666" }}>
            Team membership changes are handled by admins. Use the company request flow if you need to leave this company or join a different one.
          </p>
        </div>
      )}
    </div>
  );
}
