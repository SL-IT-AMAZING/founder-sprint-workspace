interface DashboardShellProps {
  children: React.ReactNode;
  leftSidebar?: React.ReactNode;
  rightSidebar?: React.ReactNode;
}

export default function DashboardShell({
  children,
  leftSidebar,
  rightSidebar,
}: DashboardShellProps) {
  const hasLeft = !!leftSidebar;
  const hasRight = !!rightSidebar;

  let layoutClass = "";
  if (hasLeft && hasRight) {
    layoutClass = "space-y-6 lg:grid lg:grid-cols-[200px_minmax(0,1fr)_340px] lg:items-start lg:gap-8 lg:space-y-0";
  } else if (hasLeft && !hasRight) {
    layoutClass = "space-y-6 lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:items-start lg:gap-8 lg:space-y-0";
  } else if (!hasLeft && hasRight) {
    layoutClass = "space-y-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8 lg:space-y-0";
  }

  return (
    <div className="w-full">
      {hasLeft || hasRight ? (
        <div className={layoutClass}>
          {hasLeft && (
            <aside className="hidden self-start lg:block">
              {leftSidebar}
            </aside>
          )}
          <main style={{ minWidth: 0 }}>
            {children}
          </main>
          {hasRight && (
            <aside className="order-last mt-6 self-start lg:mt-16 lg:border-l lg:border-[#E8E1D4] lg:pl-10 lg:sticky lg:top-10">
              {rightSidebar}
            </aside>
          )}
        </div>
      ) : (
        <main>{children}</main>
      )}
    </div>
  );
}
