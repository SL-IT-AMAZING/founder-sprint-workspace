"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { FollowButton } from "@/components/feed/FollowButton";
import { getDisplayName } from "@/lib/utils";
import Link from "next/link";
import { getOrCreateDMConversation } from "@/actions/messaging";

type Tab = "profile" | "posts" | "followers" | "following";

interface Experience {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
  location: string | null;
}

interface Education {
  id: string;
  institution: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startYear: number | null;
  endYear: number | null;
}

interface Batch {
  id: string;
  name: string;
  role: string;
}

interface Profile {
  id: string;
  email: string;
  name: string | null;
  profileImage: string | null;
  jobTitle: string | null;
  company: string | null;
  bio: string | null;
  headline: string | null;
  location: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  websiteUrl: string | null;
  followerCount: number;
  followingCount: number;
  experiences: Experience[];
  education: Education[];
  batches: Batch[];
}

interface UserPost {
  id: string;
  content: string;
  createdAt: Date;
  category: string | null;
  images: { id: string; imageUrl: string }[];
  _count: { comments: number; likes: number };
}

interface FollowUser {
  id: string;
  name: string | null;
  profileImage: string | null;
  headline: string | null;
  company: string | null;
  jobTitle: string | null;
}

interface ProfileClientProps {
  profile: Profile;
  isFollowing: boolean;
  isOwnProfile: boolean;
  currentUserId: string;
  userPosts: UserPost[];
  followers: FollowUser[];
  following: FollowUser[];
}

export function ProfileClient({
  profile,
  isFollowing: initialIsFollowing,
  isOwnProfile,
  userPosts,
  followers,
  following,
}: ProfileClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const formatDateRange = (startDate: string, endDate: string | null, isCurrent: boolean) => {
    const start = new Date(startDate);
    const startMonth = start.toLocaleDateString("en-US", { month: "short" });
    const startYear = start.getFullYear();

    if (isCurrent) {
      return `${startMonth} ${startYear} - Present`;
    }

    if (!endDate) {
      return `${startMonth} ${startYear}`;
    }

    const end = new Date(endDate);
    const endMonth = end.toLocaleDateString("en-US", { month: "short" });
    const endYear = end.getFullYear();

    return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
  };

  const formatYearRange = (startYear: number | null, endYear: number | null) => {
    if (!startYear && !endYear) return "";
    if (startYear && !endYear) return `${startYear}`;
    if (!startYear && endYear) return `${endYear}`;
    return `${startYear} - ${endYear}`;
  };

  // Message button component (inline with FollowButton)
  const MessageButtonWithFollow = ({
    targetUserId,
    isFollowing: initialFollowing,
  }: {
    targetUserId: string;
    isFollowing: boolean;
  }) => {
    const [loadingMsg, setLoadingMsg] = useState(false);

    const handleMessageClick = async () => {
      setLoadingMsg(true);
      try {
        const result = await getOrCreateDMConversation(targetUserId);
        if (result.success) {
          router.push(`/messages?conversation=${result.data.conversationId}`);
        } else {
          console.error("Message failed:", result.error);
          alert(result.error || "Failed to open message");
        }
      } catch (err) {
        console.error("Message error:", err);
        alert("Something went wrong opening the message");
      } finally {
        setLoadingMsg(false);
      }
    };

    return (
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <button
          onClick={handleMessageClick}
          disabled={loadingMsg}
          style={{
            backgroundColor: "#1A1A1A",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "9px",
            padding: "8px 16px",
            cursor: loadingMsg ? "wait" : "pointer",
            fontSize: "14px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            opacity: loadingMsg ? 0.7 : 1,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {loadingMsg ? "Opening..." : "Message"}
        </button>
        <FollowButton targetUserId={targetUserId} isFollowing={initialFollowing} size="md" />
      </div>
    );
  };

  return (
    <div
      style={{
        backgroundColor: "#fefaf3",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
        {/* Profile Header */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "8px",
            border: "1px solid #e0e0e0",
            padding: "32px",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "24px", marginBottom: "24px" }}>
            <Avatar src={profile.profileImage} name={getDisplayName(profile)} size={80} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#2F2C26",
                  margin: 0,
                }}
              >
                {getDisplayName(profile)}
              </h1>
              {profile.headline && (
                <p style={{ fontSize: "16px", color: "#666666", margin: "4px 0 0" }}>
                  {profile.headline}
                </p>
              )}
              {(profile.jobTitle || profile.company) && (
                <p style={{ fontSize: "14px", color: "#666666", margin: "6px 0 0" }}>
                  {[profile.jobTitle, profile.company].filter(Boolean).join(" at ")}
                </p>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                {profile.batches.map((batch) => (
                  <span
                    key={batch.id}
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      padding: "4px 12px",
                      borderRadius: "16px",
                      backgroundColor: "#1A1A1A",
                      color: "#FFFFFF",
                    }}
                  >
                    {batch.name}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: "14px", color: "#666666", marginTop: "12px" }}>
                <span style={{ fontWeight: 500, color: "#2F2C26" }}>{profile.followerCount}</span> followers
                {" · "}
                <span style={{ fontWeight: 500, color: "#2F2C26" }}>{profile.followingCount}</span> following
              </div>
            </div>
            <div>
              {isOwnProfile ? (
                <Link
                  href="/settings"
                  style={{
                    display: "inline-block",
                    padding: "0 18px",
                    height: "36px",
                    lineHeight: "34px",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#1A1A1A",
                    textDecoration: "none",
                    borderRadius: "9px",
                    border: "1px solid #1A1A1A",
                    backgroundColor: "transparent",
                    transition: "all 0.2s",
                  }}
                >
                  Edit Profile
                </Link>
              ) : (
                <MessageButtonWithFollow targetUserId={profile.id} isFollowing={initialIsFollowing} />
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "8px",
            border: "1px solid #e0e0e0",
            padding: "8px",
            marginBottom: "24px",
            display: "flex",
            gap: "8px",
          }}
        >
          {(["profile", "posts", "followers", "following"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: 500,
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor: activeTab === tab ? "#1A1A1A" : "transparent",
                color: activeTab === tab ? "#FFFFFF" : "#666666",
                textTransform: "capitalize",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "profile" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "24px" }} className="grid-cols-1 md:grid-cols-[1fr_300px]">
            {/* Main Column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* About Section */}
              {profile.bio && (
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    padding: "24px",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#2F2C26",
                      margin: "0 0 16px 0",
                    }}
                  >
                    About
                  </h2>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#2F2C26",
                      lineHeight: 1.6,
                      margin: 0,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Experience Section */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0",
                  padding: "24px",
                }}
              >
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#2F2C26",
                    margin: "0 0 16px 0",
                  }}
                >
                  Experience
                </h2>
                {profile.experiences.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {profile.experiences.map((exp) => (
                      <div key={exp.id} style={{ display: "flex", gap: "12px" }}>
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "4px",
                            backgroundColor: "#f5f5f5",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                            fontWeight: 600,
                            color: "#666666",
                          }}
                        >
                          {exp.company.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3
                            style={{
                              fontSize: "16px",
                              fontWeight: 600,
                              color: "#2F2C26",
                              margin: 0,
                            }}
                          >
                            {exp.title}
                          </h3>
                          <p
                            style={{
                              fontSize: "14px",
                              color: "#666666",
                              margin: "2px 0",
                            }}
                          >
                            {exp.company}
                          </p>
                          <p
                            style={{
                              fontSize: "13px",
                              color: "#999999",
                              margin: "2px 0",
                            }}
                          >
                            {formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                            {exp.location && ` · ${exp.location}`}
                          </p>
                          {exp.description && (
                            <p
                              style={{
                                fontSize: "14px",
                                color: "#2F2C26",
                                margin: "8px 0 0",
                                lineHeight: 1.5,
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {exp.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "14px", color: "#666666", margin: 0 }}>
                    No experience added yet
                  </p>
                )}
              </div>

              {/* Education Section */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0",
                  padding: "24px",
                }}
              >
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#2F2C26",
                    margin: "0 0 16px 0",
                  }}
                >
                  Education
                </h2>
                {profile.education.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {profile.education.map((edu) => (
                      <div key={edu.id} style={{ display: "flex", gap: "12px" }}>
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "4px",
                            backgroundColor: "#f5f5f5",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                            fontWeight: 600,
                            color: "#666666",
                          }}
                        >
                          🎓
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3
                            style={{
                              fontSize: "16px",
                              fontWeight: 600,
                              color: "#2F2C26",
                              margin: 0,
                            }}
                          >
                            {edu.institution}
                          </h3>
                          {(edu.degree || edu.fieldOfStudy) && (
                            <p
                              style={{
                                fontSize: "14px",
                                color: "#666666",
                                margin: "2px 0",
                              }}
                            >
                              {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(", ")}
                            </p>
                          )}
                          {(edu.startYear || edu.endYear) && (
                            <p
                              style={{
                                fontSize: "13px",
                                color: "#999999",
                                margin: "2px 0",
                              }}
                            >
                              {formatYearRange(edu.startYear, edu.endYear)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "14px", color: "#666666", margin: 0 }}>
                    No education added yet
                  </p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {/* Batches */}
              {profile.batches.length > 0 && (
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    padding: "20px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#2F2C26",
                      margin: "0 0 12px 0",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Batches
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {profile.batches.map((batch) => (
                      <div
                        key={batch.id}
                        style={{
                          fontSize: "13px",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          backgroundColor: "#f5f5f5",
                          color: "#2F2C26",
                        }}
                      >
                        <div style={{ fontWeight: 500 }}>{batch.name}</div>
                        <div style={{ fontSize: "12px", color: "#666666", marginTop: "2px" }}>
                          {batch.role}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location */}
              {profile.location && (
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    padding: "20px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#2F2C26",
                      margin: "0 0 12px 0",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Location
                  </h3>
                  <p style={{ fontSize: "14px", color: "#2F2C26", margin: 0 }}>
                    {profile.location}
                  </p>
                </div>
              )}

              {/* Social Links */}
              {(profile.linkedinUrl || profile.twitterUrl || profile.websiteUrl) && (
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    padding: "20px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#2F2C26",
                      margin: "0 0 12px 0",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Links
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {profile.linkedinUrl && (
                      <a
                        href={profile.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "14px",
                          color: "#0077B5",
                          textDecoration: "none",
                          transition: "opacity 0.2s",
                        }}
                      >
                        <span style={{ fontSize: "16px" }}>🔗</span>
                        LinkedIn
                      </a>
                    )}
                    {profile.twitterUrl && (
                      <a
                        href={profile.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "14px",
                          color: "#1A1A1A",
                          textDecoration: "none",
                          transition: "opacity 0.2s",
                        }}
                      >
                        <span style={{ fontSize: "16px" }}>🐦</span>
                        Twitter
                      </a>
                    )}
                    {profile.websiteUrl && (
                      <a
                        href={profile.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "14px",
                          color: "#1A1A1A",
                          textDecoration: "none",
                          transition: "opacity 0.2s",
                        }}
                      >
                        <span style={{ fontSize: "16px" }}>🌐</span>
                        Website
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Email */}
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0",
                  padding: "20px",
                }}
              >
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#2F2C26",
                    margin: "0 0 12px 0",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Contact
                </h3>
                <a
                  href={`mailto:${profile.email}`}
                  style={{
                    fontSize: "14px",
                    color: "#1A1A1A",
                    textDecoration: "none",
                    wordBreak: "break-all",
                  }}
                >
                  {profile.email}
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === "posts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {userPosts.length === 0 ? (
              <div style={{
                backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #e0e0e0",
                padding: "60px 24px", textAlign: "center",
              }}>
                <p style={{ fontSize: "16px", color: "#666666", margin: 0 }}>No posts yet</p>
              </div>
            ) : (
              userPosts.map((post) => (
                <Link key={post.id} href={`/feed/${post.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #e0e0e0",
                    padding: "16px",
                  }}>
                    <p style={{ fontSize: "14px", color: "#2F2C26", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {post.content.length > 300 ? post.content.slice(0, 300) + "..." : post.content}
                    </p>
                    {post.images.length > 0 && (
                      <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {post.images.slice(0, 3).map((img) => (
                          <img key={img.id} src={img.imageUrl} alt="" style={{
                            width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e0e0e0",
                          }} />
                        ))}
                      </div>
                    )}
                    <div style={{ marginTop: "12px", display: "flex", gap: "16px", fontSize: "13px", color: "#999999" }}>
                      {post.category && <span style={{ color: "#666666" }}>{post.category}</span>}
                      <span>{post._count.likes} likes</span>
                      <span>{post._count.comments} comments</span>
                      <span>{new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === "followers" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {followers.length === 0 ? (
              <div style={{
                backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #e0e0e0",
                padding: "60px 24px", textAlign: "center",
              }}>
                <p style={{ fontSize: "16px", color: "#666666", margin: 0 }}>No followers yet</p>
              </div>
            ) : (
              followers.map((user) => (
                <Link key={user.id} href={`/profile/${user.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #e0e0e0",
                    padding: "12px 16px",
                  }}>
                    <Avatar src={user.profileImage} name={user.name || "User"} size={40} />
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "#2F2C26", margin: 0 }}>
                        {user.name || "Unknown"}
                      </p>
                      <p style={{ fontSize: "13px", color: "#666666", margin: "2px 0 0 0" }}>
                        {[user.jobTitle, user.company].filter(Boolean).join(" at ") || user.headline || ""}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === "following" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {following.length === 0 ? (
              <div style={{
                backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #e0e0e0",
                padding: "60px 24px", textAlign: "center",
              }}>
                <p style={{ fontSize: "16px", color: "#666666", margin: 0 }}>Not following anyone yet</p>
              </div>
            ) : (
              following.map((user) => (
                <Link key={user.id} href={`/profile/${user.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #e0e0e0",
                    padding: "12px 16px",
                  }}>
                    <Avatar src={user.profileImage} name={user.name || "User"} size={40} />
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "#2F2C26", margin: 0 }}>
                        {user.name || "Unknown"}
                      </p>
                      <p style={{ fontSize: "13px", color: "#666666", margin: "2px 0 0 0" }}>
                        {[user.jobTitle, user.company].filter(Boolean).join(" at ") || user.headline || ""}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
