import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions";
import { getCompanyBySlug, getRelatedCompanies } from "@/actions/company";
import Link from "next/link";
import MessageCompanyButton from "./MessageCompanyButton";

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { slug } = await params;
  const result = await getCompanyBySlug(slug);

  if (!result.success) {
    return (
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "48px 24px",
          color: "#2F2C26",
        }}
      >
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "48px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              fontFamily: '"Libre Caslon Condensed", Georgia, serif',
              marginBottom: "16px",
            }}
          >
            Company Not Found
          </h1>
          <p style={{ color: "#666666", marginBottom: "24px" }}>
            The company you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/companies"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              backgroundColor: "#1A1A1A",
              color: "#FFFFFF",
              borderRadius: "9px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Back to Companies
          </Link>
        </div>
      </div>
    );
  }

  const company = result.data;
  const relatedResult = await getRelatedCompanies(company.id, 6);
  const relatedCompanies = relatedResult.success ? relatedResult.data : [];

  // Separate founders from other team members
  const founders = company.members.filter(
    (m) => m.role?.toLowerCase().includes("founder") || m.title?.toLowerCase().includes("founder")
  );
  const otherMembers = company.members.filter(
    (m) => !m.role?.toLowerCase().includes("founder") && !m.title?.toLowerCase().includes("founder")
  );
  
  // Get first founder's ID for messaging
  const firstFounderId = founders.length > 0 ? founders[0].user.id : null;

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "24px",
        color: "#2F2C26",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: "24px",
        }}
      >
        {/* Main Content */}
        <div>
          {/* Company Header */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              padding: "32px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", gap: "20px", alignItems: "start" }}>
              {/* Logo */}
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "8px",
                  backgroundColor: company.logoUrl ? "transparent" : "#f1eadd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                  fontWeight: "bold",
                  color: "#2F2C26",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt={company.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  company.name.charAt(0).toUpperCase()
                )}
              </div>

              {/* Company Info */}
              <div style={{ flex: 1 }}>
                <h1
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    fontFamily: '"Libre Caslon Condensed", Georgia, serif',
                    marginBottom: "8px",
                  }}
                >
                  {company.name}
                </h1>

                {company.industry && (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      backgroundColor: "#f0f2f5",
                      color: "#555555",
                      border: "1px solid #e1e4e8",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    {company.industry}
                  </span>
                )}

                {company.website && (
                  <div style={{ marginTop: "16px" }}>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        padding: "10px 20px",
                        backgroundColor: "#1A1A1A",
                        color: "#FFFFFF",
                        borderRadius: "9px",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* About Section */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              padding: "32px",
              marginBottom: "24px",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                fontFamily: '"Libre Caslon Condensed", Georgia, serif',
                marginBottom: "16px",
              }}
            >
              About
            </h2>

            {company.description && (
              <p
                style={{
                  fontSize: "14px",
                  lineHeight: "1.7",
                  color: "#2F2C26",
                  whiteSpace: "pre-wrap",
                  marginBottom: "24px",
                }}
              >
                {company.description}
              </p>
            )}

            {/* Stats Grid */}
            {(company.foundedYear || company.hqLocation || company.members.length > 0) && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "16px",
                  marginBottom: company.tags.length > 0 ? "24px" : "0",
                }}
              >
                {company.foundedYear && (
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#999999",
                        marginBottom: "4px",
                        textTransform: "uppercase",
                        fontWeight: "500",
                      }}
                    >
                      Founded
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#2F2C26",
                      }}
                    >
                      {company.foundedYear}
                    </div>
                  </div>
                )}

                {company.hqLocation && (
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#999999",
                        marginBottom: "4px",
                        textTransform: "uppercase",
                        fontWeight: "500",
                      }}
                    >
                      Headquarters
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#2F2C26",
                      }}
                    >
                      {company.hqLocation}
                    </div>
                  </div>
                )}

                {company.members.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#999999",
                        marginBottom: "4px",
                        textTransform: "uppercase",
                        fontWeight: "500",
                      }}
                    >
                      Team Size
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#2F2C26",
                      }}
                    >
                      {company.members.length} {company.members.length === 1 ? "member" : "members"}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {company.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {company.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      backgroundColor: "#f0f2f5",
                      color: "#555555",
                      border: "1px solid #e1e4e8",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "500",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Team Section */}
          {company.members.length > 0 && (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "32px",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  fontFamily: '"Libre Caslon Condensed", Georgia, serif',
                  marginBottom: "24px",
                }}
              >
                Team
              </h2>

              {/* Founders */}
              {founders.length > 0 && (
                <div style={{ marginBottom: otherMembers.length > 0 ? "32px" : "0" }}>
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#666666",
                      marginBottom: "16px",
                    }}
                  >
                    Founders
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {founders.map((member) => (
                      <div
                        key={member.id}
                        style={{
                          display: "flex",
                          gap: "12px",
                          alignItems: "start",
                        }}
                      >
                        {/* Avatar */}
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            backgroundColor: member.user.profileImage
                              ? "transparent"
                              : "#f1eadd",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#2F2C26",
                            flexShrink: 0,
                            overflow: "hidden",
                          }}
                        >
                          {member.user.profileImage ? (
                            <img
                              src={member.user.profileImage}
                              alt={member.user.name || "User"}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            (member.user.name?.charAt(0) || "U").toUpperCase()
                          )}
                        </div>

                        {/* Member Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Link
                            href={`/profile/${member.user.id}`}
                            style={{
                              display: "block",
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#1A1A1A",
                              textDecoration: "none",
                              marginBottom: "2px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {member.user.name || "Unknown"}
                          </Link>
                          {(member.title || member.role) && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#666666",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {member.title || member.role}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Team Members */}
              {otherMembers.length > 0 && (
                <div>
                  {founders.length > 0 && (
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#666666",
                        marginBottom: "16px",
                      }}
                    >
                      Team Members
                    </h3>
                  )}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {otherMembers.map((member) => (
                      <div
                        key={member.id}
                        style={{
                          display: "flex",
                          gap: "12px",
                          alignItems: "start",
                        }}
                      >
                        {/* Avatar */}
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            backgroundColor: member.user.profileImage
                              ? "transparent"
                              : "#f1eadd",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#2F2C26",
                            flexShrink: 0,
                            overflow: "hidden",
                          }}
                        >
                          {member.user.profileImage ? (
                            <img
                              src={member.user.profileImage}
                              alt={member.user.name || "User"}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            (member.user.name?.charAt(0) || "U").toUpperCase()
                          )}
                        </div>

                        {/* Member Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Link
                            href={`/profile/${member.user.id}`}
                            style={{
                              display: "block",
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#1A1A1A",
                              textDecoration: "none",
                              marginBottom: "2px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {member.user.name || "Unknown"}
                          </Link>
                          {(member.title || member.role) && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#666666",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {member.title || member.role}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Related Companies Section */}
          {relatedCompanies.length > 0 && (
            <div
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "32px",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  fontFamily: '"Libre Caslon Condensed", Georgia, serif',
                  marginBottom: "24px",
                }}
              >
                Related Companies
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                  gap: "16px",
                }}
              >
                {relatedCompanies.map((relatedCompany) => (
                  <Link
                    key={relatedCompany.id}
                    href={`/companies/${relatedCompany.slug}`}
                    style={{
                      display: "block",
                      padding: "16px",
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      textDecoration: "none",
                      color: "#2F2C26",
                      transition: "border-color 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                      {/* Logo */}
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "6px",
                          backgroundColor: relatedCompany.logoUrl
                            ? "transparent"
                            : "#f1eadd",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          fontWeight: "bold",
                          flexShrink: 0,
                          overflow: "hidden",
                        }}
                      >
                        {relatedCompany.logoUrl ? (
                          <img
                            src={relatedCompany.logoUrl}
                            alt={relatedCompany.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          relatedCompany.name.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            marginBottom: "4px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {relatedCompany.name}
                        </div>
                        {relatedCompany.industry && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#666666",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {relatedCompany.industry}
                          </div>
                        )}
                      </div>
                    </div>

                    {relatedCompany.description && (
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#666666",
                          lineHeight: "1.5",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {relatedCompany.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div
          style={{
            position: "sticky",
            top: "88px",
            alignSelf: "start",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              padding: "24px",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                marginBottom: "16px",
                fontFamily: '"Libre Caslon Condensed", Georgia, serif',
              }}
            >
              Company Info
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {company.foundedYear && (
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#999999",
                      marginBottom: "4px",
                      textTransform: "uppercase",
                      fontWeight: "500",
                    }}
                  >
                    Founded
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#2F2C26",
                      fontWeight: "500",
                    }}
                  >
                    {company.foundedYear}
                  </div>
                </div>
              )}

              {company.hqLocation && (
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#999999",
                      marginBottom: "4px",
                      textTransform: "uppercase",
                      fontWeight: "500",
                    }}
                  >
                    Headquarters
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#2F2C26",
                      fontWeight: "500",
                    }}
                  >
                    {company.hqLocation}
                  </div>
                </div>
              )}

              {company.website && (
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#999999",
                      marginBottom: "4px",
                      textTransform: "uppercase",
                      fontWeight: "500",
                    }}
                  >
                    Website
                  </div>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: "14px",
                      color: "#1A1A1A",
                      textDecoration: "underline",
                      wordBreak: "break-all",
                    }}
                  >
                    {company.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}

              <div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#999999",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                    fontWeight: "500",
                  }}
                >
                  Team
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#2F2C26",
                    fontWeight: "500",
                  }}
                >
                  {company.members.length} {company.members.length === 1 ? "member" : "members"}
                </div>
              </div>

              {company.tags.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#999999",
                      marginBottom: "8px",
                      textTransform: "uppercase",
                      fontWeight: "500",
                    }}
                  >
                    Tags
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {company.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          backgroundColor: "#f0f2f5",
                          color: "#555555",
                          border: "1px solid #e1e4e8",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "500",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
