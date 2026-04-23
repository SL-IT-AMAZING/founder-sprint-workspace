import Link from 'next/link';
import { type ReactNode } from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  badge?: ReactNode;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  badge,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-6 border-b border-[#2f2c251f]">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-[11px] text-[#00000080]">
            {breadcrumbs.map((item, index) => (
              <li key={index} className="flex items-center gap-2">
                {index > 0 && (
                  <span className="text-[#00000040]">/</span>
                )}
                {item.href ? (
                  <Link
                    href={item.href}
                    className="hover:text-[#000] transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-[#000]">{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] leading-[1.2] tracking-[-0.02em] font-normal">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-[18px] leading-[1.4] text-[#00000080] max-w-[566px]">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  size?: 'lg' | 'md' | 'sm';
}

const sectionTitleStyles = {
  lg: 'text-[28px] leading-[1.2] tracking-[-0.02em]',
  md: 'text-[22px] leading-[1.25] tracking-[-0.02em]',
  sm: 'text-[18px] leading-[1.3] tracking-[-0.01em]',
};

export function SectionHeader({
  title,
  description,
  actions,
  size = 'md',
}: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex flex-col gap-1">
        <h2 className={`${sectionTitleStyles[size]} font-normal`}>
          {title}
        </h2>
        {description && (
          <p className="text-sm leading-[1.4] text-[#00000080]">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
