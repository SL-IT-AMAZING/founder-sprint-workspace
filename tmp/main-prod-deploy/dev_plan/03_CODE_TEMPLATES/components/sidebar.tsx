'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';

interface SidebarItem {
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: string | number;
}

interface SidebarSection {
  title?: string;
  items: SidebarItem[];
}

interface SidebarProps {
  sections: SidebarSection[];
  footer?: ReactNode;
}

export function Sidebar({ sections, footer }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-[260px] h-screen sticky top-0 flex flex-col bg-[#f1eadd] border-r border-[#2f2c251f]">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/images/logo.svg" alt="Logo" className="h-8" />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            {section.title && (
              <div className="px-3 mb-2 text-[11px] font-mono font-medium uppercase tracking-[0.1em] text-[#00000080]">
                {section.title}
              </div>
            )}
            <ul className="flex flex-col gap-1">
              {section.items.map((item, itemIndex) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={itemIndex}>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-2
                        rounded-[6px]
                        text-sm font-medium
                        transition-colors duration-200
                        ${isActive 
                          ? 'bg-[#fefaf3] text-[#000]' 
                          : 'text-[#000] hover:bg-[#fefaf380]'
                        }
                      `}
                    >
                      {item.icon && (
                        <span className="w-5 h-5 flex items-center justify-center opacity-70">
                          {item.icon}
                        </span>
                      )}
                      <span className="flex-1">{item.label}</span>
                      {item.badge !== undefined && (
                        <span className="
                          px-2 py-0.5
                          text-[10px] font-mono
                          bg-[#2f2c250f]
                          rounded-full
                        ">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {footer && (
        <div className="p-4 border-t border-[#2f2c251f]">
          {footer}
        </div>
      )}
    </aside>
  );
}

export function SidebarUser({
  name,
  email,
  avatarUrl,
  onLogout,
}: {
  name: string;
  email: string;
  avatarUrl?: string;
  onLogout: () => void;
}) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3">
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-[#fefaf3] flex items-center justify-center text-sm font-medium">
          {initials}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{name}</div>
        <div className="text-[11px] text-[#00000080] truncate">{email}</div>
      </div>
      <button
        onClick={onLogout}
        aria-label="Logout"
        className="
          w-8 h-8
          flex items-center justify-center
          rounded-full
          hover:bg-[#fefaf3]
          transition-colors
        "
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6M10.6667 11.3333L14 8M14 8L10.6667 4.66667M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

export default Sidebar;
