"use client";

import { usePathname } from "next/navigation";

const FULL_WIDTH_ROUTES = ["/messages"];

export default function DashboardMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullWidth = FULL_WIDTH_ROUTES.some((route) => pathname.startsWith(route));

  return (
    <main
      className="min-w-0"
      style={
        isFullWidth
          ? { flex: 1 }
          : { maxWidth: "1200px", margin: "0 auto", padding: "20px 16px" }
      }
    >
      {children}
    </main>
  );
}
