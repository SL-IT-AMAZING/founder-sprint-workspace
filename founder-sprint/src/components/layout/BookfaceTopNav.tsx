"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/actions/auth";
import { useState, useEffect, useRef } from "react";
import BatchSwitcher from "@/components/layout/BatchSwitcher";
import { getDisplayName } from "@/lib/utils";
import UnreadBadge from "@/components/layout/UnreadBadge";

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

type SearchPostResult = {
  id: string;
  content: string;
  authorName: string;
};

type SearchUserResult = {
  id: string;
  name: string;
  profileImage: string | null;
  headline: string | null;
  jobTitle: string | null;
  company: string | null;
};

type SearchCompanyResult = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  industry: string | null;
  logoUrl: string | null;
  memberCount: number;
};

type SearchResponse = {
  posts: SearchPostResult[];
  users: SearchUserResult[];
  companies: SearchCompanyResult[];
};

const emptySearchResults: SearchResponse = {
  posts: [],
  users: [],
  companies: [],
};

interface BookfaceTopNavProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    profileImage?: string | null;
  };
  isAdmin?: boolean;
  batches?: Array<{ batchId: string; batchName: string; batchStatus?: string; endDate?: Date }>;
  currentBatchId?: string;
}

export default function BookfaceTopNav({ 
  user, 
  isAdmin = false, 
  batches = [], 
  currentBatchId = "" 
}: BookfaceTopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse>(emptySearchResults);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const menuDropdownRef = useRef<HTMLDivElement>(null);

  const name = getDisplayName(user);
  const avatar = user.profileImage;

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openDropdown]);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (trimmedQuery.length < 2) {
      setSearchResults(emptySearchResults);
      setIsSearching(false);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    let isCancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}&type=all`);

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json() as SearchResponse;
        if (!isCancelled) {
          setSearchResults({
            posts: data.posts ?? [],
            users: data.users ?? [],
            companies: data.companies ?? [],
          });
        }
      } catch {
        if (!isCancelled) {
          setSearchResults(emptySearchResults);
        }
      } finally {
        if (!isCancelled) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/feed?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowResults(false);
      setSearchQuery("");
    }
  };

  const closeSearchResultsWithDelay = () => {
    window.setTimeout(() => {
      setShowResults(false);
    }, 200);
  };

  const navigateFromSearch = (path: string) => {
    router.push(path);
    setShowResults(false);
    setSearchQuery("");
  };

  const dropdownMenus = [
    {
      key: "community",
      label: "Community",
      items: [
        { href: "/feed", label: "Feed" },
        { href: "/founders", label: "Founders" },
        { href: "/companies", label: "Companies" },
      ],
    },
    {
      key: "advice",
      label: "Advice",
      items: [
        { href: "/office-hours", label: "Office Hours" },
        { href: "/schedule", label: "Schedule" },
      ],
    },
    {
      key: "tools",
      label: "Tools",
      items: [
        { href: "/questions", label: "Questions" },
        { href: "/assignments", label: "Assignments" },
      ],
    },
    {
      key: "contact",
      label: "Contact",
      items: [
        { href: "/messages", label: "Messages" },
        ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
      ],
    },
  ];

  const allMobileLinks = dropdownMenus.flatMap(menu => menu.items);

  return (
    <nav 
      style={{
        height: '48px',
        backgroundColor: '#2F2C26',
        padding: '0 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
        <Link
          href="/dashboard"
          style={{
            textDecoration: 'none',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Image
            src="/images/Outsome-Symbol_White_Moving.svg"
            alt="Outsome"
            width={32}
            height={32}
            style={{ width: 32, height: 32 }}
            priority
          />
        </Link>

        <div 
          ref={menuDropdownRef}
          className="hidden lg:flex" 
          style={{ 
            alignItems: 'center', 
            gap: '20px',
            position: 'relative'
          }}
        >
          {dropdownMenus.map((menu) => (
            <div key={menu.key} style={{ position: 'relative' }}>
              <button
                onClick={() => setOpenDropdown(openDropdown === menu.key ? null : menu.key)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: openDropdown === menu.key ? 500 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  opacity: openDropdown === menu.key ? 1.0 : 0.9,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1.0'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = openDropdown === menu.key ? '1.0' : '0.9'}
              >
                {menu.label}
                <span style={{ fontSize: '10px' }}>▼</span>
              </button>

              {openDropdown === menu.key && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    backgroundColor: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    padding: '4px 0',
                    minWidth: '200px',
                    zIndex: 200,
                    marginTop: '8px',
                  }}
                >
                  {menu.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        display: 'block',
                        padding: '10px 14px',
                        fontSize: '14px',
                        color: '#2F2C26',
                        textDecoration: 'none',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <form 
        onSubmit={handleSearchSubmit}
        className="hidden lg:block"
        style={{ 
          flex: '0 0 300px',
          marginLeft: '16px',
          marginRight: '16px',
          position: 'relative',
        }}
      >
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (searchQuery.trim().length >= 2) {
              setShowResults(true);
            }
          }}
          onBlur={closeSearchResultsWithDelay}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setShowResults(false);
            }
          }}
          placeholder="Search Outsome"
          style={{
            width: '100%',
            height: '32px',
            backgroundColor: '#404040',
            border: 'none',
            borderRadius: '4px',
            padding: '0 12px',
            color: 'white',
            fontSize: '14px',
            outline: 'none',
          }}
        />

        {showResults && searchQuery.trim().length >= 2 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: '100%',
              backgroundColor: '#ffffff',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              maxHeight: '400px',
              overflowY: 'auto',
              zIndex: 300,
              marginTop: '8px',
            }}
          >
            {isSearching ? (
              <div
                style={{
                  padding: '12px',
                  fontSize: '14px',
                  color: '#666666',
                }}
              >
                Searching...
              </div>
            ) : (
              <>
                {searchResults.users.length > 0 && (
                  <>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#999999',
                        textTransform: 'uppercase',
                        padding: '8px 12px',
                      }}
                    >
                      People
                    </div>
                    {searchResults.users.map((person) => {
                      const subtitle = [person.jobTitle, person.company].filter(Boolean).join(' at ');

                      return (
                        <div
                          key={person.id}
                          onMouseDown={() => navigateFromSearch(`/profile/${person.id}`)}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {person.profileImage ? (
                            <img
                              src={person.profileImage}
                              alt={person.name}
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: '#f1eadd',
                                color: '#2F2C26',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              👤
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '14px',
                                fontWeight: 700,
                                color: '#2F2C26',
                                lineHeight: 1.2,
                              }}
                            >
                              {person.name}
                            </div>
                            <div
                              style={{
                                fontSize: '12px',
                                color: '#666666',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {subtitle || person.headline || 'Founder'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {searchResults.companies.length > 0 && (
                  <>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#999999',
                        textTransform: 'uppercase',
                        padding: '8px 12px',
                      }}
                    >
                      Companies
                    </div>
                    {searchResults.companies.map((company) => (
                      <div
                        key={company.id}
                        onMouseDown={() => navigateFromSearch(`/companies/${company.slug}`)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        {company.logoUrl ? (
                          <img
                            src={company.logoUrl}
                            alt={company.name}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '4px',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '4px',
                              backgroundColor: '#f1eadd',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                            }}
                          >
                            🏢
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: '#2F2C26',
                              lineHeight: 1.2,
                            }}
                          >
                            {company.name}
                          </div>
                          <div
                            style={{
                              fontSize: '12px',
                              color: '#666666',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {company.industry || `${company.memberCount} members`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {searchResults.posts.length > 0 && (
                  <>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#999999',
                        textTransform: 'uppercase',
                        padding: '8px 12px',
                      }}
                    >
                      Posts
                    </div>
                    {searchResults.posts.map((post) => (
                      <div
                        key={post.id}
                        onMouseDown={() => navigateFromSearch(`/feed/${post.id}`)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div
                          style={{
                            fontSize: '14px',
                            color: '#2F2C26',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          📝 {truncateText(post.content, 80)}
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#666666',
                          }}
                        >
                          {post.authorName}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {searchResults.users.length === 0 &&
                  searchResults.companies.length === 0 &&
                  searchResults.posts.length === 0 && (
                    <div
                      style={{
                        padding: '12px',
                        fontSize: '14px',
                        color: '#666666',
                      }}
                    >
                      No results found.
                    </div>
                  )}

                <div
                  onMouseDown={() => navigateFromSearch(`/feed?q=${encodeURIComponent(searchQuery.trim())}`)}
                  style={{
                    padding: '10px 12px',
                    borderTop: '1px solid #e0e0e0',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#2F2C26',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  View all results →
                </div>
              </>
            )}
          </div>
        )}
      </form>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0,
      }}>
        <Link
          href="/messages"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 7l-10 7L2 7" />
          </svg>
          <UnreadBadge />
        </Link>
        {batches.length > 1 && (
          <div className="hidden lg:block">
            <BatchSwitcher batches={batches} currentBatchId={currentBatchId} />
          </div>
        )}

        <Link
          href="/settings"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(255, 255, 255, 0.2)',
              }}
            />
          ) : (
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: '#404040',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {getInitials(name)}
            </div>
          )}
        </Link>
        
        <form action={signOut} className="hidden lg:block">
          <button
            type="submit"
            style={{
              color: 'white',
              opacity: 0.7,
              fontSize: '12px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              padding: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1.0'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
          >
            Sign out
          </button>
        </form>

        <button
          className="lg:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            background: 'none',
            border: 'none',
            padding: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}
        >
          <Image
            src="/images/icon-interface-menu.svg"
            alt="Menu"
            width={24}
            height={24}
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </button>
      </div>

      {isMobileMenuOpen && (
        <>
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              top: '48px',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 99
            }}
          />
          
          <div style={{
            position: 'absolute',
            top: '48px',
            left: 0,
            width: '100%',
            backgroundColor: '#2F2C26',
            borderTop: '1px solid #404040',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            zIndex: 100,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            animation: 'slideDown 0.2s ease-out'
          }}>
            {batches.length > 1 && (
              <div style={{ padding: '0 0 8px 0', borderBottom: '1px solid #404040' }}>
                <BatchSwitcher batches={batches} currentBatchId={currentBatchId} />
              </div>
            )}

            <form onSubmit={handleSearchSubmit} style={{ width: '100%' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Outsome"
                style={{
                  width: '100%',
                  height: '40px',
                  backgroundColor: '#404040',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0 12px',
                  color: 'white',
                  fontSize: '16px',
                }}
              />
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {allMobileLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{
                      color: 'white',
                      fontSize: '16px',
                      opacity: isActive ? 1.0 : 0.8,
                      fontWeight: isActive ? 600 : 400,
                      textDecoration: 'none',
                      padding: '8px 0',
                      borderBottom: '1px solid #404040'
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <form action={signOut} style={{ marginTop: '8px' }}>
              <button
                type="submit"
                style={{
                  color: 'white',
                  fontSize: '16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  padding: '8px 0',
                  width: '100%',
                  textAlign: 'left',
                  fontWeight: 500
                }}
              >
                Sign out
              </button>
            </form>
          </div>
          
          <style jsx>{`
            @keyframes slideDown {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </>
      )}
    </nav>
  );
}
