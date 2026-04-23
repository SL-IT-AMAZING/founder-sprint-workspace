import React from 'react';

export interface Tab {
  id: string;
  label: string;
  count?: number;
}

export interface FeedTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const defaultTabs: Tab[] = [
  { id: 'top', label: 'Top' },
  { id: 'recent', label: 'Recent' },
  { id: 'general', label: 'General' },
  { id: 'launch', label: 'Launch' },
  { id: 'classifieds', label: 'Classifieds' },
  { id: 'recruiting', label: 'Recruiting' },
];

export const FeedTabs: React.FC<FeedTabsProps> = ({
  tabs = defaultTabs,
  activeTab,
  onTabChange,
}) => {
  const [hoveredTab, setHoveredTab] = React.useState<string | null>(null);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-start',
    width: '100%',
    overflowX: 'auto',
    borderBottom: '1px solid #E8E1D4',
    backgroundColor: 'transparent',
    scrollbarWidth: 'none',
  };

  const innerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '28px',
    padding: '0 6px 0 0',
    minWidth: 'max-content',
  };

  const getTabStyle = (tabId: string): React.CSSProperties => {
    const isActive = activeTab === tabId;
    const isHovered = hoveredTab === tabId;

    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '10px 0 11px',
      cursor: 'pointer',
      color: isActive ? '#2F2C26' : '#7A7468',
      borderBottom: isActive ? '2px solid #2F2C26' : '2px solid transparent',
      marginBottom: '-1px',
      background: 'none',
      fontSize: '14px',
      fontWeight: isActive ? 600 : 500,
      transition: 'color 0.2s ease, border-color 0.2s ease',
      whiteSpace: 'nowrap',
      flexShrink: 0,
      opacity: !isActive && isHovered ? 0.92 : 1,
    };
  };

  return (
    <div style={containerStyle}>
      <div style={innerStyle}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            style={getTabStyle(tab.id)}
            onClick={() => onTabChange(tab.id)}
            onMouseEnter={() => setHoveredTab(tab.id)}
            onMouseLeave={() => setHoveredTab(null)}
            role="tab"
            aria-selected={activeTab === tab.id}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && <span style={{ opacity: 0.8 }}>({tab.count})</span>}
          </button>
        ))}
      </div>
    </div>
  );
};
