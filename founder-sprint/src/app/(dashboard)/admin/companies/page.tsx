import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { getCompaniesDirectory } from "@/actions/directory";
import { getCompanyChangeRequestsForAdmin } from "@/actions/company";
import { CompanyList } from "./CompanyList";
import { CompanyRequestList } from "./CompanyRequestList";

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
  const requestsResult = await getCompanyChangeRequestsForAdmin();
  const requests = requestsResult.success ? requestsResult.data : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>Company Management</h1>
      </div>
      <CompanyRequestList initialRequests={requests} />
      <CompanyList initialCompanies={companies} />
    </div>
  );
}
