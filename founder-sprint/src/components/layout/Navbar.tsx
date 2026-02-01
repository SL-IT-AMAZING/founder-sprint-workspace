'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "@/actions/auth";
import { useState, useEffect } from "react";

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

interface NavbarProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
  isAdmin?: boolean;
}

export default function Navbar({ user, isAdmin = false }: NavbarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const name = user.user_metadata?.full_name || user.email || "";
  const avatar = user.user_metadata?.avatar_url;

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/questions", label: "Questions" },
    { href: "/feed", label: "Feed" },
    { href: "/events", label: "Events" },
    { href: "/office-hours", label: "Office Hours" },
    { href: "/sessions", label: "Sessions" },
    { href: "/assignments", label: "Assignments" },
  ];

  const adminLinks = isAdmin ? [
    { href: "/admin/batches", label: "Admin" },
  ] : [];

  const allLinks = [...navLinks, ...adminLinks];

  return (
    <nav style={{
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
    }}>
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
          priority
        />
      </Link>

      <div className="hidden lg:flex" style={{
        alignItems: 'center',
        gap: '24px',
        marginLeft: '24px',
        flex: 1,
      }}>
        {allLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                color: 'white',
                fontSize: '14px',
                opacity: isActive ? 1.0 : 0.9,
                fontWeight: isActive ? 500 : 400,
                textDecoration: 'none',
                transition: 'opacity 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1.0'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = isActive ? '1.0' : '0.9'}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="hidden lg:block" style={{
        position: 'relative',
        marginLeft: 'auto',
        marginRight: '24px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#404040',
          borderRadius: '4px',
          padding: '6px 12px',
          width: '240px',
          border: '1px solid transparent',
        }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            style={{ marginRight: '8px', flexShrink: 0 }}
          >
            <path
              d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11Z"
              stroke="#999"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13 13L9.5 9.5"
              stroke="#999"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'white',
              fontSize: '14px',
              width: '100%',
              padding: 0,
            }}
            onFocus={(e) => e.currentTarget.parentElement!.style.borderColor = '#666'}
            onBlur={(e) => e.currentTarget.parentElement!.style.borderColor = 'transparent'}
          />
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0,
        marginLeft: 'auto',
      }}>
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
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
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#404040',
              borderRadius: '4px',
              padding: '8px 12px',
              width: '100%',
            }}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                style={{ marginRight: '8px', flexShrink: 0 }}
              >
                <path
                  d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11Z"
                  stroke="#999"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13 13L9.5 9.5"
                  stroke="#999"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'white',
                  fontSize: '14px',
                  width: '100%',
                  padding: 0,
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {allLinks.map((link) => {
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
