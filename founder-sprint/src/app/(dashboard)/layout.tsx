import Navbar from "@/components/layout/Navbar";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin as checkIsAdmin } from "@/lib/permissions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const user = await getCurrentUser();
  const userIsAdmin = user ? checkIsAdmin(user.role) : false;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-background)" }}>
      <Navbar user={authUser} isAdmin={userIsAdmin} />
      <div className="main-container lg:grid lg:grid-cols-[240px_1fr] lg:gap-6 pt-6 pb-8">
        <aside className="hidden lg:block">
          <DashboardSidebar isAdmin={userIsAdmin} />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
