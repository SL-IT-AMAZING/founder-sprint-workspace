"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import type { UserRole } from "@/types";

interface SearchBarProps {
  initialSearch: string;
  initialRole: UserRole | "all";
}

export function SearchBar({ initialSearch, initialRole }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set("search", search.trim());
    } else {
      params.delete("search");
    }
    params.delete("page");
    const queryString = params.toString();
    router.push(queryString ? `/founders?${queryString}` : "/founders");
  };

  return (
    <form onSubmit={handleSearchSubmit} style={{ marginBottom: "24px" }}>
      <input
        type="text"
        placeholder="Search founders by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "12px 16px",
          fontSize: "14px",
          borderRadius: "6px",
          border: "1px solid #e0e0e0",
          color: "#2F2C26",
          backgroundColor: "#FFFFFF",
        }}
      />
    </form>
  );
}
