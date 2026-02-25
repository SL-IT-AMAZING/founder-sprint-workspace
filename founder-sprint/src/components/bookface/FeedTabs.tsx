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
  onTabChange 
}) => {
  const [hoveredTab, setHoveredTab] = React.useState<string | null>(null);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap: 0,
    borderBottom: '1px solid #e0e0e0',
    width: '100%',
    overflowX: 'auto',
    backgroundColor: '#fff',
  };

  const getTabStyle = (tabId: string): React.CSSProperties => {
    const isActive = activeTab === tabId;
    const isHovered = hoveredTab === tabId;

    return {
      padding: '12px 16px',
      cursor: 'pointer',
      color: isActive ? '#1A1A1A' : '#666666',
      borderBottom: isActive ? '2px solid #1A1A1A' : '2px solid transparent',
      marginBottom: '-1px',
      backgroundColor: (!isActive && isHovered) ? '#fefaf3' : 'transparent',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap',
    };
  };

  return (
    <div style={containerStyle}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          style={getTabStyle(tab.id)}
          onClick={() => onTabChange(tab.id)}
          onMouseEnter={() => setHoveredTab(tab.id)}
          onMouseLeave={() => setHoveredTab(null)}
          role="tab"
          aria-selected={activeTab === tab.id}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onTabChange(tab.id);
            }
          }}
        >
          {tab.label}
          {tab.count !== undefined && <span style={{ marginLeft: '4px', opacity: 0.8 }}>({tab.count})</span>}
        </div>
      ))}
    </div>
  );
};
