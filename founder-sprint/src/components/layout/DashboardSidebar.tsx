"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItemData {
  id: string;
  label: string;
  icon: string;
  href: string;
}

const NAV_ITEMS: NavItemData[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠', href: '/dashboard' },
  { id: 'feed', label: 'Feed', icon: '📰', href: '/feed' },
  { id: 'assignments', label: 'Assignments', icon: '📝', href: '/assignments' },
  { id: 'questions', label: 'Questions', icon: '❓', href: '/questions' },
  { id: 'submissions', label: 'Submissions', icon: '📤', href: '/submissions' },
  { id: 'groups', label: 'Groups', icon: '👥', href: '/groups' },
  { id: 'events', label: 'Events', icon: '📅', href: '/events' },
  { id: 'sessions', label: 'Sessions', icon: '🎥', href: '/sessions' },
  { id: 'office-hours', label: 'Office Hours', icon: '⏰', href: '/office-hours' },
  { id: 'settings', label: 'Settings', icon: '⚙️', href: '/settings' },
];

const ADMIN_NAV_ITEMS: NavItemData[] = [
  { id: 'admin', label: 'Admin', icon: '👑', href: '/admin' },
];

const styles = {
  container: {
    position: 'sticky' as const,
    top: '60px', // 48px navbar + 12px gap
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    padding: '8px 0',
    width: '100%',
    minWidth: '200px',
    border: '1px solid #e0e0e0',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
};

interface NavItemProps {
  item: NavItemData;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ item, isActive }) => {
  const [isHovered, setIsHovered] = useState(false);

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    cursor: 'pointer',
    backgroundColor: isActive
      ? 'rgba(85, 90, 185, 0.1)'
      : isHovered
        ? 'rgba(0, 0, 0, 0.04)'
        : 'transparent',
    color: isActive ? '#555AB9' : '#2F2C26',
    fontWeight: isActive ? 600 : 400,
    fontSize: '14px',
    textDecoration: 'none',
    transition: 'background-color 0.2s ease, color 0.2s ease',
    margin: '2px 8px',
    borderRadius: '6px',
    userSelect: 'none' as const,
  };

  const iconStyle: React.CSSProperties = {
    marginRight: '12px',
    fontSize: '16px',
    display: 'inline-flex',
    alignItems: 'center',
    width: '20px',
  };

  return (
    <Link
      href={item.href}
      style={itemStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-current={isActive ? 'page' : undefined}
    >
      <span style={iconStyle}>{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );
};

interface DashboardSidebarProps {
  isAdmin?: boolean;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ isAdmin = false }) => {
  const pathname = usePathname();

  const allNavItems = isAdmin ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS;

  return (
    <aside style={styles.container}>
      <nav style={{ width: '100%' }}>
        {allNavItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
          />
        ))}
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
