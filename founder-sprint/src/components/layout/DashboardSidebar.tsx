"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItemData {
  id: string;
  label: string;
  iconSrc: string;
  href: string;
  prefetch?: boolean;
  children?: { id: string; label: string; href: string }[];
}

const NAV_ITEMS: NavItemData[] = [
  { id: 'dashboard', label: 'Dashboard', iconSrc: '/images/icon-decorative-home.svg', href: '/dashboard', prefetch: true },
  { id: 'feed', label: 'Feed', iconSrc: '/images/icon-decorative-messaging.svg', href: '/feed', prefetch: true },
  { id: 'assignments', label: 'Assignments', iconSrc: '/images/icon-decorative-planner.svg', href: '/assignments', prefetch: true },
  { id: 'questions', label: 'Questions', iconSrc: '/images/icon-decorative-comments.svg', href: '/questions', prefetch: true },
  { id: 'submissions', label: 'Submissions', iconSrc: '/images/icon-interface-arrow-up-right.svg', href: '/submissions' },
  { id: 'groups', label: 'Companies', iconSrc: '/images/icon-decorative-hierarchy.svg', href: '/groups' },
  {
    id: 'schedule',
    label: 'Schedule',
    iconSrc: '/images/icon-decorative-calendar.svg',
    href: '/schedule',
    prefetch: true,
    children: [
      { id: 'events', label: 'Events', href: '/events' },
      { id: 'sessions', label: 'Sessions', href: '/sessions' },
      { id: 'office-hours', label: 'Office Hours', href: '/office-hours' },
    ],
  },
  { id: 'settings', label: 'Settings', iconSrc: '/images/icon-decorative-settings.svg', href: '/settings' },
];

const ADMIN_NAV_ITEMS: NavItemData[] = [
  { id: 'admin', label: 'Admin', iconSrc: '/images/icon-decorative-favorites-shield.svg', href: '/admin' },
];

const SCHEDULE_PATHS = ['/schedule', '/events', '/sessions', '/office-hours'];

const styles = {
  container: {
    position: 'sticky' as const,
    top: '60px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    padding: '8px 0',
    width: '100%',
    minWidth: '200px',
    border: '1px solid #e0e0e0',
    boxSizing: 'border-box' as const,
  },
};

interface NavItemProps {
  item: NavItemData;
  isActive: boolean;
  pathname: string;
}

const NavItem: React.FC<NavItemProps> = ({ item, isActive, pathname }) => {
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isInScheduleSection = hasChildren && SCHEDULE_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  const [isOpen, setIsOpen] = useState(isInScheduleSection);

  useEffect(() => {
    if (isInScheduleSection) {
      setIsOpen(true);
    }
  }, [pathname]);

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

  if (hasChildren) {
    return (
      <div>
        <div
          style={itemStyle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Link
            href={item.href}
            prefetch={item.prefetch ?? false}
            style={{
              flex: 1,
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              fontWeight: 'inherit',
            }}
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
            <span style={{ flex: 1 }}>{item.label}</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Collapse schedule menu' : 'Expand schedule menu'}
            style={{
              padding: '4px 4px 4px 8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="currentColor"
              style={{
                opacity: 0.4,
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                flexShrink: 0,
              }}
            >
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
        </div>

        {hasChildren && (
          <div
            style={{
              overflow: 'hidden',
              transition: 'max-height 0.2s ease',
              maxHeight: isOpen ? '200px' : '0',
            }}
          >
            {item.children!.map((child) => {
              const isChildActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
              return (
                <SubNavItem key={child.id} href={child.href} label={child.label} isActive={isChildActive} />
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
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
        <span style={{ flex: 1 }}>{item.label}</span>
      </Link>
    </div>
  );
};

const SubNavItem: React.FC<{ href: string; label: string; isActive: boolean }> = ({ href, label, isActive }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '7px 16px 7px 48px',
        fontSize: '13px',
        color: isActive ? '#1A1A1A' : '#666666',
        fontWeight: isActive ? 600 : 400,
        backgroundColor: isActive
          ? 'rgba(0, 0, 0, 0.04)'
          : isHovered
            ? 'rgba(0, 0, 0, 0.02)'
            : 'transparent',
        textDecoration: 'none',
        transition: 'background-color 0.15s ease, color 0.15s ease',
        margin: '1px 8px',
        borderRadius: '6px',
        userSelect: 'none' as const,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-current={isActive ? 'page' : undefined}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          backgroundColor: isActive ? '#1A1A1A' : '#CCCCCC',
          marginRight: 10,
          flexShrink: 0,
          transition: 'background-color 0.15s ease',
        }}
      />
      {label}
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
        {allNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`) ||
            (item.id === 'schedule' && SCHEDULE_PATHS.some(
              (p) => pathname === p || pathname.startsWith(`${p}/`)
            ));

          return (
            <NavItem
              key={item.id}
              item={item}
              isActive={isActive}
              pathname={pathname}
            />
          );
        })}
      </nav>
    </aside>
  );
};

export default DashboardSidebar;
