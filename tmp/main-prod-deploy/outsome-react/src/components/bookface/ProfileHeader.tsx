import React from 'react';

export interface ProfileTab {
  id: string;
  label: string;
  count?: number;
}

export interface ProfileHeaderProps {
  type: 'user' | 'company';
  name: string;
  username?: string;
  avatarUrl?: string;
  title?: string;
  company?: string;
  companyId?: string;
  batch?: string;
  isOwnProfile?: boolean;
  isFollowing?: boolean;
  tabs?: ProfileTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onMessageClick?: () => void;
  onFollowClick?: () => void;
  onEditProfile?: () => void;
  onCompanyClick?: () => void;
}

const styles = {
  container: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e0e0e0',
    padding: '24px 24px 0 24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  topSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  infoGroup: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#e0e0e0',
    objectFit: 'cover' as const,
    border: '1px solid #f0f0f0',
  },
  companyAvatar: {
    borderRadius: '8px',
  },
  details: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    marginTop: '4px',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
  },
  name: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#2F2C26',
    margin: 0,
  },
  username: {
    fontSize: '16px',
    color: '#666666',
    fontWeight: 400,
  },
  roleRow: {
    fontSize: '14px',
    color: '#2F2C26',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  companyLink: {
    color: '#555AB9',
    textDecoration: 'none',
    fontWeight: 500,
    cursor: 'pointer',
  },
  batchBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbeed5',
    color: '#9a5b13',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
    marginLeft: '4px',
  },
  actionButtons: {
    display: 'flex',
    gap: '12px',
    paddingTop: '4px',
  },
  button: {
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#555AB9',
    color: '#ffffff',
    border: '1px solid #555AB9',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    color: '#555AB9',
    border: '1px solid #555AB9',
  },
  tabsContainer: {
    display: 'flex',
    gap: '24px',
    marginTop: '16px',
  },
  tab: {
    padding: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: 500,
    color: '#666666',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'color 0.2s ease',
  },
  activeTab: {
    color: '#2F2C26',
    borderBottom: '2px solid #555AB9',
  },
  countBadge: {
    backgroundColor: '#f0f0f0',
    color: '#666666',
    fontSize: '11px',
    padding: '1px 6px',
    borderRadius: '10px',
    fontWeight: 600,
  }
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  type,
  name,
  username,
  avatarUrl,
  title,
  company,
  batch,
  isOwnProfile = false,
  isFollowing = false,
  tabs = [],
  activeTab,
  onTabChange,
  onMessageClick,
  onFollowClick,
  onEditProfile,
  onCompanyClick,
}) => {
  
  const getAvatarStyle = () => {
    const base = styles.avatar;
    if (type === 'company') {
      return { ...base, ...styles.companyAvatar };
    }
    return base;
  };

  return (
    <div style={styles.container}>
      <div style={styles.topSection}>
        <div style={styles.infoGroup}>
          <img 
            src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`} 
            alt={name}
            style={getAvatarStyle()}
          />
          
          <div style={styles.details}>
            <div style={styles.nameRow}>
              <h1 style={styles.name}>{name}</h1>
              {username && <span style={styles.username}>({username})</span>}
            </div>
            
            <div style={styles.roleRow}>
              {title && <span>{title}</span>}
              {company && (
                <>
                  {title && <span>at</span>}
                  <span 
                    style={styles.companyLink}
                    onClick={onCompanyClick}
                    role={onCompanyClick ? "button" : undefined}
                  >
                    {company}
                  </span>
                </>
              )}
              {batch && (
                <span style={styles.batchBadge}>
                  {batch}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={styles.actionButtons}>
          {isOwnProfile ? (
            <button 
              style={{...styles.button, ...styles.outlineButton}}
              onClick={onEditProfile}
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button 
                style={{...styles.button, ...styles.outlineButton}}
                onClick={onMessageClick}
              >
                Message
              </button>
              <button 
                style={{
                  ...styles.button, 
                  ...(isFollowing ? styles.outlineButton : styles.primaryButton)
                }}
                onClick={onFollowClick}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </>
          )}
        </div>
      </div>

      {tabs.length > 0 && (
        <div style={styles.tabsContainer}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <div
                key={tab.id}
                style={{
                  ...styles.tab,
                  ...(isActive ? styles.activeTab : {})
                }}
                onClick={() => onTabChange?.(tab.id)}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span style={styles.countBadge}>{tab.count}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
