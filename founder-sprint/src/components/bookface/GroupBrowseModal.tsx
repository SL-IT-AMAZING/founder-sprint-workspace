import React, { useState } from 'react';

export interface Group {
  id: string;
  name: string;
  badge?: string;
  createdBy: string;
  lastActive: string;
  memberCount: number;
  memberAvatars: string[];
}

export interface GroupBrowseModalProps {
  isOpen: boolean;
  groups: Group[];
  onClose: () => void;
  onCreateGroup?: () => void;
  onJoinGroup?: (groupId: string) => void;
  onSearch?: (query: string) => void;
  onSortChange?: (sort: string) => void;
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: '600px',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    display: 'flex',
    flexDirection: 'column' as const,
    maxHeight: '85vh',
    margin: '16px',
    overflow: 'hidden',
    position: 'relative' as const,
  },
  header: {
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e0e0e0',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#1a1a1a',
    margin: 0,
  },
  createButton: {
    backgroundColor: '#1A1A1A',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
    marginLeft: '12px',
  },
  controls: {
    padding: '16px 24px',
    display: 'flex',
    gap: '12px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#fafafa',
  },
  searchInputWrapper: {
    position: 'relative' as const,
    flex: 1,
  },
  searchIcon: {
    position: 'absolute' as const,
    left: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#999',
    width: '16px',
    height: '16px',
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px 8px 34px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  sortSelect: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#333',
    backgroundColor: 'white',
    cursor: 'pointer',
    outline: 'none',
  },
  groupList: {
    overflowY: 'auto' as const,
    padding: '0',
    margin: 0,
    listStyle: 'none',
  },
  groupItem: {
    padding: '16px 24px',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.1s',
  },
  groupInfo: {
    flex: 1,
    minWidth: 0, // Enable text truncation
    marginRight: '20px',
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  groupName: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1a1a1a',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  badge: {
    backgroundColor: '#eef0ff',
    color: '#1A1A1A',
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  groupMeta: {
    fontSize: '13px',
    color: '#666',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  memberSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  avatarStack: {
    display: 'flex',
    flexDirection: 'row-reverse' as const, // Reverse so first item is on top if using negative margins
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '2px solid white',
    marginLeft: '-8px', // Stack effect
    objectFit: 'cover' as const,
    backgroundColor: '#eee',
  },
  memberCount: {
    fontSize: '13px',
    color: '#666',
    fontWeight: 500,
    minWidth: '40px',
    textAlign: 'right' as const,
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center' as const,
    color: '#666',
  }
};

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const GroupBrowseModal: React.FC<GroupBrowseModalProps> = ({
  isOpen,
  groups,
  onClose,
  onCreateGroup,
  onJoinGroup,
  onSearch,
  onSortChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch?.(value);
  };

  const filteredGroups = onSearch 
    ? groups 
    : groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={styles.overlay} onClick={handleOverlayClick}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ flex: 1 }}>
            <h2 style={styles.title}>Browse public groups</h2>
          </div>
          <div style={styles.headerLeft}>
            <button 
              style={styles.createButton}
              onClick={onCreateGroup}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#44499e'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1A1A1A'}
            >
              Create group
            </button>
            <button 
              style={styles.closeButton} 
              onClick={onClose}
              aria-label="Close modal"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          <div style={styles.searchInputWrapper}>
            <span style={styles.searchIcon}>
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search groups..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={(e) => e.currentTarget.style.borderColor = '#1A1A1A'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
            />
          </div>
          <select 
            style={styles.sortSelect}
            onChange={(e) => onSortChange?.(e.target.value)}
          >
            <option value="recent">Recently Active</option>
            <option value="newest">Newest</option>
            <option value="popular">Most Popular</option>
            <option value="alphabetical">A-Z</option>
          </select>
        </div>

        {/* List */}
        <ul style={styles.groupList}>
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <li 
                key={group.id} 
                style={{
                  ...styles.groupItem,
                  backgroundColor: hoveredGroup === group.id ? '#f9f9f9' : 'white'
                }}
                onMouseEnter={() => setHoveredGroup(group.id)}
                onMouseLeave={() => setHoveredGroup(null)}
                onClick={() => onJoinGroup?.(group.id)}
              >
                <div style={styles.groupInfo}>
                  <div style={styles.groupHeader}>
                    <span style={styles.groupName}>{group.name}</span>
                    {group.badge && (
                      <span style={styles.badge}>{group.badge}</span>
                    )}
                  </div>
                  <div style={styles.groupMeta}>
                    Created by {group.createdBy} · Last active {group.lastActive}
                  </div>
                </div>

                <div style={styles.memberSection}>
                  <div style={styles.avatarStack}>
                    {group.memberAvatars.slice(0, 8).reverse().map((avatar, index) => (
                      <img 
                        key={index}
                        src={avatar}
                        alt="Member"
                        style={{
                          ...styles.avatar,
                          zIndex: index
                        }}
                      />
                    ))}
                  </div>
                  <span style={styles.memberCount}>
                    {group.memberCount}
                  </span>
                </div>
              </li>
            ))
          ) : (
            <div style={styles.emptyState}>
              No groups found
            </div>
          )}
        </ul>
      </div>
    </div>
  );
};

export default GroupBrowseModal;
