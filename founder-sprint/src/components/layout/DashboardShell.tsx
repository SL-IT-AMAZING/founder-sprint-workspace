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
  
  let gridClass = "";
  if (hasLeft && hasRight) {
    gridClass = "lg:grid lg:grid-cols-[200px_1fr_280px] lg:gap-6";
  } else if (hasLeft && !hasRight) {
    gridClass = "lg:grid lg:grid-cols-[200px_1fr] lg:gap-6";
  } else if (!hasLeft && hasRight) {
    gridClass = "lg:grid lg:grid-cols-[1fr_280px] lg:gap-6";
  }

  return (
    <div>
      {hasLeft || hasRight ? (
        <div className={gridClass}>
          {hasLeft && (
            <aside className="hidden lg:block">
              {leftSidebar}
            </aside>
          )}
          <main style={{ minWidth: 0 }}>
            {children}
          </main>
          {hasRight && (
            <aside className="hidden lg:block">
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
