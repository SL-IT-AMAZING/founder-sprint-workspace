"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItemData {
  id: string;
  label: string;
  iconSrc: string;
  href: string;
  prefetch?: boolean;
}

const NAV_ITEMS: NavItemData[] = [
  { id: 'dashboard', label: 'Dashboard', iconSrc: '/images/icon-decorative-home.svg', href: '/dashboard', prefetch: true },
  { id: 'feed', label: 'Feed', iconSrc: '/images/icon-decorative-messaging.svg', href: '/feed', prefetch: true },
  { id: 'assignments', label: 'Assignments', iconSrc: '/images/icon-decorative-planner.svg', href: '/assignments', prefetch: true },
  { id: 'questions', label: 'Questions', iconSrc: '/images/icon-decorative-comments.svg', href: '/questions', prefetch: true },
  { id: 'submissions', label: 'Submissions', iconSrc: '/images/icon-interface-arrow-up-right.svg', href: '/submissions' },
  { id: 'groups', label: 'Groups', iconSrc: '/images/icon-decorative-hierarchy.svg', href: '/groups' },
  { id: 'events', label: 'Events', iconSrc: '/images/icon-decorative-calendar.svg', href: '/events', prefetch: true },
  { id: 'sessions', label: 'Sessions', iconSrc: '/images/icon-interface-play.svg', href: '/sessions', prefetch: true },
  { id: 'office-hours', label: 'Office Hours', iconSrc: '/images/icon-decorative-clock.svg', href: '/office-hours', prefetch: true },
  { id: 'settings', label: 'Settings', iconSrc: '/images/icon-decorative-settings.svg', href: '/settings' },
];

const ADMIN_NAV_ITEMS: NavItemData[] = [
  { id: 'admin', label: 'Admin', iconSrc: '/images/icon-decorative-favorites-shield.svg', href: '/admin' },
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
      ? 'rgba(0, 0, 0, 0.06)'
      : isHovered
        ? 'rgba(0, 0, 0, 0.04)'
        : 'transparent',
    color: isActive ? '#1A1A1A' : '#2F2C26',
    fontWeight: isActive ? 600 : 400,
    fontSize: '14px',
    textDecoration: 'none',
    transition: 'background-color 0.2s ease, color 0.2s ease',
    margin: '2px 8px',
    borderRadius: '6px',
    userSelect: 'none' as const,
  };

  const iconContainerStyle: React.CSSProperties = {
    marginRight: '12px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    flexShrink: 0,
  };

  return (
    <Link
      href={item.href}
      prefetch={item.prefetch ?? false}
      style={itemStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-current={isActive ? 'page' : undefined}
    >
      <span style={iconContainerStyle}>
        <Image
          src={item.iconSrc}
          alt=""
          width={20}
          height={20}
          style={{ 
            opacity: isActive ? 1 : 0.7,
            transition: 'opacity 0.2s ease',
          }}
        />
      </span>
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
