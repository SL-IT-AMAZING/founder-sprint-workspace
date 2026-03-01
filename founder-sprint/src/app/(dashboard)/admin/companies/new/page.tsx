import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { CompanyForm } from "./CompanyForm";

export default async function NewCompanyPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }
  
  if (!isAdmin(user.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>Create Company</h1>
        <p className="text-sm mt-1" style={{ color: "#666" }}>
          Add a new company to the directory
        </p>
      </div>
      <CompanyForm />
    </div>
  );
}
