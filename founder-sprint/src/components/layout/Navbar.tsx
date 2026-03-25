'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "@/actions/auth";
import { useState, useEffect, useRef } from "react";
import BatchSwitcher from "@/components/layout/BatchSwitcher";
import { getDisplayName } from "@/lib/utils";
function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

interface NavbarProps {
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

export default function Navbar({ user, isAdmin = false, batches = [], currentBatchId = "" }: NavbarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const menuDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setIsMobileMenuOpen(false);
      setOpenDropdown(null);
    }, 0);

    return () => window.clearTimeout(timeoutId);
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

  const name = getDisplayName(user);
  const avatar = user.profileImage;

  const primaryLinks = [
    { href: "/feed", label: "Feed" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  const desktopMenus = [
    {
      key: "batch",
      label: "Batch",
      href: "/schedule",
      items: [
        { href: "/schedule", label: "Schedule" },
        { href: "/assignments", label: "Assignments" },
        { href: "/office-hours", label: "Office Hours" },
        { href: "/questions", label: "Questions" },
      ],
    },
    {
      key: "community",
      label: "Community",
      href: "/founders",
      items: [
        { href: "/founders", label: "Founders" },
        { href: "/companies", label: "Companies" },
        { href: "/messages", label: "Messages" },
      ],
    },
  ];

  const allLinks = [
    ...primaryLinks,
    ...desktopMenus.flatMap((menu) => menu.items),
    ...(isAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  const isPathActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

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
          style={{ width: 32, height: 32 }}
          priority
        />
      </Link>

      <div className="hidden lg:flex" ref={menuDropdownRef} style={{
        alignItems: 'center',
        gap: '24px',
        marginLeft: '24px',
        flex: 1,
      }}>
        {primaryLinks.map((link) => {
          const isActive = isPathActive(link.href);
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
        {desktopMenus.map((menu) => {
          const isMenuActive = menu.items.some((item) => isPathActive(item.href));
          return (
            <div key={menu.key} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Link
                href={menu.href}
                style={{
                  color: 'white',
                  fontSize: '14px',
                  opacity: isMenuActive ? 1.0 : 0.9,
                  fontWeight: isMenuActive ? 500 : 400,
                  textDecoration: 'none',
                  transition: 'opacity 0.2s',
                  whiteSpace: 'nowrap',
                  padding: '4px 4px 4px 0',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1.0'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = isMenuActive ? '1.0' : '0.9'}
              >
                {menu.label}
              </Link>
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === menu.key ? null : menu.key)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '10px',
                  cursor: 'pointer',
                  padding: '4px 0 4px 2px',
                  opacity: 0.9,
                }}
                aria-label={`${menu.label} menu`}
              >
                ▼
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
          );
        })}
        {isAdmin && (
          <Link
            href="/admin"
            style={{
              color: 'white',
              fontSize: '14px',
              opacity: isPathActive('/admin') ? 1.0 : 0.9,
              fontWeight: isPathActive('/admin') ? 500 : 400,
              textDecoration: 'none',
              transition: 'opacity 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1.0'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = isPathActive('/admin') ? '1.0' : '0.9'}
          >
            Admin
          </Link>
        )}
        {batches.length > 1 && (
          <div style={{ marginLeft: '8px', flexShrink: 0 }}>
            <BatchSwitcher batches={batches} currentBatchId={currentBatchId} />
          </div>
        )}
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
