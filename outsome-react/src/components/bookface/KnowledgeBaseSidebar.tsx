import React, { useState } from 'react';

export interface KnowledgeBaseSection {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children?: {
    id: string;
    title: string;
  }[];
}

export interface KnowledgeBaseSidebarProps {
  sections: KnowledgeBaseSection[];
  activeSection?: string;
  activeArticle?: string;
  onSectionClick?: (sectionId: string) => void;
  onArticleClick?: (sectionId: string, articleId: string) => void;
  onSearch?: (query: string) => void;
  className?: string;
}

const styles = {
  sidebar: {
    width: '280px',
    height: '100%',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column' as const,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: '#2F2C26',
  },
  searchContainer: {
    padding: '16px',
    borderBottom: '1px solid #f0f0f0',
  },
  searchInputWrapper: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute' as const,
    left: '10px',
    color: '#888',
    width: '14px',
    height: '14px',
  },
  searchInput: {
    width: '100%',
    padding: '8px 8px 8px 32px',
    borderRadius: '4px',
    border: '1px solid #e0e0e0',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#f9f9f9',
    transition: 'border-color 0.2s, background-color 0.2s',
  },
  scrollContainer: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '8px 0',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    userSelect: 'none' as const,
    transition: 'background-color 0.1s',
    color: '#2F2C26',
  },
  sectionHeaderActive: {
    color: '#555AB9',
  },
  sectionIcon: {
    marginRight: '8px',
    display: 'flex',
    alignItems: 'center',
    color: '#888',
  },
  sectionTitle: {
    flex: 1,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
  },
  chevron: {
    marginLeft: '8px',
    transition: 'transform 0.2s',
    color: '#aaa',
  },
  chevronExpanded: {
    transform: 'rotate(90deg)',
  },
  articleList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  articleItem: {
    padding: '8px 16px 8px 44px',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#555',
    transition: 'background-color 0.1s, color 0.1s',
    display: 'block',
    textDecoration: 'none',
  },
  articleItemActive: {
    color: '#555AB9',
    backgroundColor: '#f0f1ff',
    fontWeight: 500,
  },
  hover: {
    backgroundColor: '#f5f5f5',
  }
};

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const ChevronRightIcon = ({ style }: { style?: React.CSSProperties }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
  </svg>
);

const FileTextIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <line x1="10" y1="9" x2="8" y2="9"></line>
  </svg>
);

export const KnowledgeBaseSidebar: React.FC<KnowledgeBaseSidebarProps> = ({
  sections,
  activeSection,
  activeArticle,
  onSectionClick,
  onArticleClick,
  onSearch,
  className
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (activeSection) initial[activeSection] = true;
    sections.forEach(section => {
      if (section.children?.some(child => child.id === activeArticle)) {
        initial[section.id] = true;
      }
    });
    return initial;
  });

  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
    onSectionClick?.(sectionId);
  };

  const handleArticleClick = (sectionId: string, articleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onArticleClick?.(sectionId, articleId);
  };

  return (
    <div style={styles.sidebar} className={className}>
      <div style={styles.searchContainer}>
        <div style={styles.searchInputWrapper}>
          <div style={styles.searchIcon}>
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search Knowledge Base"
            style={styles.searchInput}
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      </div>

      <div style={styles.scrollContainer}>
        {sections.map(section => {
          const isExpanded = expandedSections[section.id];
          const hasChildren = section.children && section.children.length > 0;
          const isActive = section.id === activeSection && !activeArticle;
          const isHovered = hoveredItem === section.id;

          return (
            <div key={section.id}>
              <div
                style={{
                  ...styles.sectionHeader,
                  ...(isActive ? styles.sectionHeaderActive : {}),
                  ...(isHovered ? styles.hover : {})
                }}
                onClick={() => toggleSection(section.id)}
                onMouseEnter={() => setHoveredItem(section.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div style={styles.sectionIcon}>
                  {section.icon || (hasChildren ? <FolderIcon /> : <FileTextIcon />)}
                </div>
                <span style={styles.sectionTitle}>{section.title}</span>
                {hasChildren && (
                  <div style={{
                    ...styles.chevron,
                    ...(isExpanded ? styles.chevronExpanded : {})
                  }}>
                    <ChevronRightIcon />
                  </div>
                )}
              </div>

              {hasChildren && isExpanded && (
                <ul style={styles.articleList}>
                  {section.children!.map(child => {
                    const isChildActive = child.id === activeArticle;
                    const isChildHovered = hoveredItem === child.id;

                    return (
                      <li key={child.id}>
                        <div
                          style={{
                            ...styles.articleItem,
                            ...(isChildActive ? styles.articleItemActive : {}),
                            ...(!isChildActive && isChildHovered ? styles.hover : {})
                          }}
                          onClick={(e) => handleArticleClick(section.id, child.id, e)}
                          onMouseEnter={() => setHoveredItem(child.id)}
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          {child.title}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
