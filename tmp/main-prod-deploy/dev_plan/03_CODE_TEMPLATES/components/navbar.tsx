'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Avatar } from './avatar';

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  onLogout?: () => void;
}

interface NavLinkProps {
  href: string;
  children: ReactNode;
}

function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`
        text-sm font-medium
        transition-opacity duration-200
        ${isActive ? 'opacity-100' : 'opacity-70 hover:opacity-100'}
      `}
    >
      {children}
    </Link>
  );
}

export function Navbar({ user, onLogout }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[99] bg-[#fefaf3]">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="h-[72px] flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center">
            <img 
              src="/images/logo.svg" 
              alt="Founder Sprint" 
              className="h-9"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-6 flex-1">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/questions">Questions</NavLink>
            <NavLink href="/office-hours">Office Hours</NavLink>
            <NavLink href="/assignments">Assignments</NavLink>
            <NavLink href="/community">Community</NavLink>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2"
                >
                  <Avatar 
                    src={user.avatarUrl} 
                    name={user.name} 
                    size="sm"
                  />
                  <span className="hidden md:block text-sm font-medium">
                    {user.name}
                  </span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 16 16" 
                    fill="none"
                  >
                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="
                      absolute top-full right-0 mt-2
                      w-[212px]
                      p-3
                      bg-[#fefaf399]
                      border border-[#fff6]
                      rounded-[6px]
                      shadow-[0_4px_18px_0_#0000001f]
                      backdrop-blur-[12px]
                      z-20
                    ">
                      <div className="px-2 pb-3 mb-3 border-b border-[#2f2c251f]">
                        <div className="text-sm font-medium">{user.name}</div>
                        <div className="text-[11px] text-[#00000080]">{user.email}</div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Link
                          href="/settings"
                          className="
                            px-2 py-1.5
                            text-sm
                            rounded-[4px]
                            hover:bg-[#2f2c250f]
                            transition-colors
                          "
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Settings
                        </Link>
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onLogout?.();
                          }}
                          className="
                            px-2 py-1.5
                            text-sm text-left
                            rounded-[4px]
                            hover:bg-[#2f2c250f]
                            transition-colors
                          "
                        >
                          Log out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="
                  h-[42px] px-[18px]
                  inline-flex items-center justify-center
                  bg-[#000] text-[#fefaf3]
                  rounded-[9px]
                  text-sm font-medium
                  hover:bg-[#333]
                  transition-colors
                "
              >
                Sign In
              </Link>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-[#2f2c251f]">
          <nav className="flex flex-col p-4 gap-2">
            <Link href="/dashboard" className="py-2 text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
              Dashboard
            </Link>
            <Link href="/questions" className="py-2 text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
              Questions
            </Link>
            <Link href="/office-hours" className="py-2 text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
              Office Hours
            </Link>
            <Link href="/assignments" className="py-2 text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
              Assignments
            </Link>
            <Link href="/community" className="py-2 text-sm font-medium" onClick={() => setIsMenuOpen(false)}>
              Community
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
