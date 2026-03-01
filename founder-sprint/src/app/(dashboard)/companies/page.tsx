import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { getCompaniesDirectory } from "@/actions/directory";
import { SearchBar } from "./SearchBar";

export const revalidate = 30;

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; industry?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const search = params.search || "";
  const industry = params.industry || "";
  const page = Math.max(1, parseInt(params.page || "1", 10));

  const companiesResult = await getCompaniesDirectory({
    batchId: user.batchId,
    search: search || undefined,
    industry: industry || undefined,
    page,
    limit: 20,
  });

  if (!companiesResult.success) {
    return (
      <div style={{ padding: "24px", color: "#ef4444" }}>
        Error loading companies: {companiesResult.error}
      </div>
    );
  }

  const { companies, total, hasMore } = companiesResult.data;
  const totalPages = Math.ceil(total / 20);

  const buildUrl = (newPage: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (industry) params.set("industry", industry);
    if (newPage > 1) params.set("page", newPage.toString());
    const queryString = params.toString();
    return queryString ? `/companies?${queryString}` : "/companies";
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getColorFromName = (name: string): string => {
    const colors = [
      "#E8F5E9",
      "#FFF3E0",
      "#E3F2FD",
      "#F3E5F5",
      "#FFF9C4",
      "#FFE0B2",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const userIsAdmin = isAdmin(user.role);

  return (
    <div>
      <div style={{ marginBottom: "32px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 600,
              fontFamily: '"Libre Caslon Condensed", Georgia, serif',
              color: "#2F2C26",
              marginBottom: "8px",
            }}
          >
            Companies
          </h1>
          <p style={{ fontSize: "14px", color: "#666666" }}>
            {total} companies in your batch
          </p>
        </div>
        {userIsAdmin && (
          <Link
            href="/admin/companies/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 500,
              borderRadius: "9px",
              backgroundColor: "#1A1A1A",
              color: "#FFFFFF",
              textDecoration: "none",
              transition: "background-color 0.2s",
            }}
          >
            + Create Company
          </Link>
        )}
      </div>

      <SearchBar initialSearch={search} />

      {companies.length === 0 ? (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            color: "#999999",
          }}
        >
          No companies found
          {search && ` matching "${search}"`}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/companies/${company.slug}`}
              style={{
                textDecoration: "none",
                backgroundColor: "#FFFFFF",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt={company.name}
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "8px",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "8px",
                      backgroundColor: getColorFromName(company.name),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#666666",
                    }}
                  >
                    {getInitials(company.name)}
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#2F2C26",
                      marginBottom: "4px",
                    }}
                  >
                    {company.name}
                  </h3>
                  {company.industry && (
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "#666666",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        backgroundColor: "#f5f5f5",
                        display: "inline-block",
                      }}
                    >
                      {company.industry}
                    </span>
                  )}
                </div>
              </div>

              {company.description && (
                <p
                  style={{
                    fontSize: "14px",
                    color: "#666666",
                    lineHeight: "1.5",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {company.description}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "auto",
                }}
              >
                {company.hqLocation && (
                  <span style={{ fontSize: "13px", color: "#999999" }}>
                    {company.hqLocation}
                  </span>
                )}

                {company.memberCount > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", marginLeft: "auto" }}>
                      {company.memberAvatars.slice(0, 3).map((avatar, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            border: "2px solid #FFFFFF",
                            marginLeft: idx > 0 ? "-8px" : "0",
                            backgroundColor: "#e0e0e0",
                            overflow: "hidden",
                          }}
                        >
                          {avatar ? (
                            <img
                              src={avatar}
                              alt=""
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                backgroundColor: "#e0e0e0",
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <span style={{ fontSize: "13px", color: "#666666" }}>
                      {company.memberCount}{" "}
                      {company.memberCount === 1 ? "member" : "members"}
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            marginTop: "32px",
          }}
        >
          {page > 1 ? (
            <Link
              href={buildUrl(page - 1)}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 500,
                borderRadius: "9px",
                border: "1px solid #e0e0e0",
                color: "#2F2C26",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              Previous
            </Link>
          ) : (
            <span
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 500,
                borderRadius: "9px",
                border: "1px solid #e0e0e0",
                color: "#999999",
                opacity: 0.5,
              }}
            >
              Previous
            </span>
          )}

          <span style={{ fontSize: "14px", color: "#666666" }}>
            Page {page} of {totalPages}
          </span>

          {page < totalPages ? (
            <Link
              href={buildUrl(page + 1)}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 500,
                borderRadius: "9px",
                border: "1px solid #e0e0e0",
                color: "#2F2C26",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              Next
            </Link>
          ) : (
            <span
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 500,
                borderRadius: "9px",
                border: "1px solid #e0e0e0",
                color: "#999999",
                opacity: 0.5,
              }}
            >
              Next
            </span>
          )}
        </div>
      )}
    </div>
  );
}
