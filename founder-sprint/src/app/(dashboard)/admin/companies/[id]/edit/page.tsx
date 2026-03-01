import { redirect, notFound } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { CompanyForm } from "../../new/CompanyForm";
import { MemberManager } from "./MemberManager";

interface EditCompanyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCompanyPage({ params }: EditCompanyPageProps) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }
  
  if (!isAdmin(user.role)) {
    redirect("/dashboard");
  }

  const { id } = await params;


  const company = await prisma.company.findUnique({
    where: { id },
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
    },
  });

  if (!company) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>Edit Company</h1>
        <p className="text-sm mt-1" style={{ color: "#666" }}>
          Update company information and manage team members
        </p>
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
      />

      <MemberManager 
        companyId={company.id}
        members={company.members.map(m => ({
          id: m.id,
          role: m.role,
          title: m.title,
          isCurrent: m.isCurrent,
          user: {
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
            profileImage: m.user.profileImage,
          },
        }))}
      />
    </div>
  );
}
