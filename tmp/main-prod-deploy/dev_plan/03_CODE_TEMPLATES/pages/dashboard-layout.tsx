'use client';

import { type ReactNode } from 'react';
import { Sidebar, SidebarUser } from '../components/sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  user: {
    name: string;
    email: string;
    avatarUrl?: string;
    role: 'founder' | 'mentor' | 'admin';
  };
  onLogout: () => void;
}

const founderNavigation = [
  {
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="11" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="2" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="11" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Learning',
    items: [
      {
        label: 'Questions',
        href: '/questions',
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7.5 7.5C7.5 6.12 8.62 5 10 5C11.38 5 12.5 6.12 12.5 7.5C12.5 8.88 11.38 10 10 10V11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="10" cy="14" r="0.75" fill="currentColor"/>
          </svg>
        ),
      },
      {
        label: 'Office Hours',
        href: '/office-hours',
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="4" width="14" height="13" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M3 8H17" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M13 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ),
      },
      {
        label: 'Assignments',
        href: '/assignments',
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 3H16C16.5523 3 17 3.44772 17 4V16C17 16.5523 16.5523 17 16 17H4C3.44772 17 3 16.5523 3 16V4C3 3.44772 3.44772 3 4 3Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 8L9 10L13 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 14H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Community',
    items: [
      {
        label: 'Posts',
        href: '/community',
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M17 10C17 13.866 13.866 17 10 17C8.93913 17 7.93 16.7791 7.02051 16.3804L3 17L3.61961 12.9795C3.22094 12.07 3 11.0609 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        ),
      },
    ],
  },
];

const mentorNavigation = [
  {
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="11" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="2" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="11" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Mentor',
    items: [
      {
        label: 'Questions',
        href: '/questions',
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7.5 7.5C7.5 6.12 8.62 5 10 5C11.38 5 12.5 6.12 12.5 7.5C12.5 8.88 11.38 10 10 10V11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="10" cy="14" r="0.75" fill="currentColor"/>
          </svg>
        ),
      },
      {
        label: 'Office Hours',
        href: '/office-hours',
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="4" width="14" height="13" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M3 8H17" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M13 2V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ),
      },
      {
        label: 'Review Submissions',
        href: '/submissions',
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 3H16C16.5523 3 17 3.44772 17 4V16C17 16.5523 16.5523 17 16 17H4C3.44772 17 3 16.5523 3 16V4C3 3.44772 3.44772 3 4 3Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 8L9 10L13 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 14H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ),
      },
    ],
  },
];

const adminNavigation = [
  {
    items: [
      {
        label: 'Dashboard',
        href: '/admin',
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="11" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="2" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="11" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Users', href: '/admin/users', icon: null },
      { label: 'Cohorts', href: '/admin/cohorts', icon: null },
      { label: 'Programs', href: '/admin/programs', icon: null },
      { label: 'Questions', href: '/admin/questions', icon: null },
      { label: 'Assignments', href: '/admin/assignments', icon: null },
      { label: 'Office Hours', href: '/admin/office-hours', icon: null },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'System', href: '/admin/settings', icon: null },
    ],
  },
];

export function DashboardLayout({ children, user, onLogout }: DashboardLayoutProps) {
  const navigation = 
    user.role === 'admin' ? adminNavigation :
    user.role === 'mentor' ? mentorNavigation :
    founderNavigation;

  return (
    <div className="flex min-h-screen bg-[#fefaf3]">
      <Sidebar
        sections={navigation}
        footer={
          <SidebarUser
            name={user.name}
            email={user.email}
            avatarUrl={user.avatarUrl}
            onLogout={onLogout}
          />
        }
      />
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1156px] mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
