import React, { useState } from 'react';

export interface LeftSidebarProps {
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
  collapsed?: boolean;
}

interface NavItemData {
  id: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItemData[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'people', label: 'People', icon: '👥' },
  { id: 'companies', label: 'Companies', icon: '🏢' },
  { id: 'knowledge', label: 'Knowledge', icon: '📚' },
  { id: 'jobs', label: 'Jobs', icon: '💼' },
  { id: 'events', label: 'Events', icon: '📅' },
  { id: 'messages', label: 'Messages', icon: '💬' },
  { id: 'library', label: 'Library', icon: '📖' },
];

const styles = {
  container: {
    position: 'sticky' as const,
    top: '68px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    padding: '8px 0',
    width: '100%',
    minWidth: '200px',
    border: '1px solid #e0e0e0',
    fontFamily: '"BDO Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxSizing: 'border-box' as const,
  },
  collapsedContainer: {
    minWidth: 'auto',
    width: 'fit-content',
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column' as const,
  },
};

const NavItem: React.FC<{
  item: NavItemData;
  isActive: boolean;
  onClick?: (id: string) => void;
  collapsed?: boolean;
}> = ({ item, isActive, onClick, collapsed }) => {
  const [isHovered, setIsHovered] = useState(false);

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: collapsed ? '10px' : '10px 16px',
    justifyContent: collapsed ? 'center' : 'flex-start',
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
    marginRight: collapsed ? '0' : '12px',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px', 
  };

  return (
    <div
      style={itemStyle}
      onClick={() => onClick?.(item.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-current={isActive ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
    >
      <span style={iconStyle}>{item.icon}</span>
      {!collapsed && <span>{item.label}</span>}
    </div>
  );
};

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
  activeItem = 'home', 
  onItemClick, 
  collapsed = false 
}) => {
  const containerStyle = {
    ...styles.container,
    ...(collapsed ? styles.collapsedContainer : {}),
  };

  return (
    <aside style={containerStyle}>
      <nav style={{ width: '100%' }}>
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={activeItem === item.id}
            onClick={onItemClick}
            collapsed={collapsed}
          />
        ))}
      </nav>
    </aside>
  );
};

export default LeftSidebar;
