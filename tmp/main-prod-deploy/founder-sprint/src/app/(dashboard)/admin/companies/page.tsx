import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { getCompaniesDirectory } from "@/actions/directory";
import { CompanyList } from "./CompanyList";

export default async function AdminCompaniesPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }
  
  if (!isAdmin(user.role)) {
    redirect("/dashboard");
  }

  const result = await getCompaniesDirectory({});
  const companies = result.success ? result.data.companies : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>Company Management</h1>
      </div>
      <CompanyList initialCompanies={companies} />
    </div>
  );
}
