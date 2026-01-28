import React, { useState } from 'react';

export interface BookfaceHeaderProps {
  userName?: string;
  userAvatarUrl?: string;
  notificationCount?: number;
  onLogoClick?: () => void;
  onSearchSubmit?: (query: string) => void;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
}

export const BookfaceHeader: React.FC<BookfaceHeaderProps> = ({
  userName = "User",
  userAvatarUrl = "https://i.pravatar.cc/150?u=a042581f4e29026704d",
  notificationCount = 0,
  onLogoClick,
  onSearchSubmit,
  onNotificationClick,
  onProfileClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(searchQuery);
    }
  };

  const navItems = ['Community', 'Advice', 'Tools', 'Contact'];

  const styles = {
    header: {
      height: '48px',
      backgroundColor: '#2F2C26',
      padding: '0 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontFamily: '"BDO Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      boxSizing: 'border-box' as const,
      width: '100%',
      position: 'relative' as const,
      zIndex: 100,
    },
    leftSection: {
      display: 'flex',
      alignItems: 'center',
    },
    logo: {
      width: '32px',
      height: '32px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    navLinks: {
      display: 'flex',
      marginLeft: '24px',
      gap: '24px',
    },
    navLink: {
      color: 'white',
      fontSize: '14px',
      opacity: 0.9,
      textDecoration: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      transition: 'opacity 0.2s',
    },
    dropdownArrow: {
      fontSize: '10px',
      opacity: 0.7,
    },
    centerSection: {
      flex: 1,
      display: 'flex',
      justifyContent: 'center',
      padding: '0 20px',
    },
    searchContainer: {
      backgroundColor: '#404040',
      borderRadius: '4px',
      padding: '6px 12px',
      display: 'flex',
      alignItems: 'center',
      width: '300px',
      maxWidth: '100%',
      border: isSearchFocused ? '1px solid #666' : '1px solid transparent',
      transition: 'border-color 0.2s',
    },
    searchIcon: {
      color: '#999',
      marginRight: '8px',
      fontSize: '14px',
    },
    searchInput: {
      backgroundColor: 'transparent',
      border: 'none',
      color: 'white',
      outline: 'none',
      width: '100%',
      fontSize: '14px',
    },
    rightSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
    },
    notificationContainer: {
      position: 'relative' as const,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
    },
    notificationIcon: {
      color: 'white',
      fontSize: '20px',
    },
    badge: {
      position: 'absolute' as const,
      top: '-2px',
      right: '-2px',
      backgroundColor: '#ef4444',
      color: 'white',
      borderRadius: '50%',
      width: '16px',
      height: '16px',
      fontSize: '10px',
      fontWeight: 'bold',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      border: '2px solid #2F2C26',
    },
    avatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.2)',
      cursor: 'pointer',
      objectFit: 'cover' as const,
    },
  };

  return (
    <header style={styles.header}>
      <div style={styles.leftSection}>
        <div 
          style={styles.logo} 
          onClick={onLogoClick}
          title="Outsome Community"
        >
          <svg width="32" height="32" viewBox="0 0 298 329" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M339.5 31.8755C339.5 49.4797 325.266 63.7509 307.707 63.7509C290.149 63.7509 275.915 49.4797 275.915 31.8755C275.915 14.2711 290.149 0 307.707 0C325.266 0 339.5 14.2711 339.5 31.8755Z" fill="#fefaf3" transform="translate(-170, 0) scale(0.5)"/>
            <path d="M244.121 179.299C244.121 126.801 201.673 84.242 149.311 84.242C96.9488 84.242 54.5015 126.801 54.5015 179.299C54.5015 231.798 96.9488 274.357 149.311 274.357V329C66.8488 329 0 261.977 0 179.299C0 96.6222 66.8488 29.5985 149.311 29.5985C231.773 29.5985 298.622 96.6222 298.622 179.299C298.622 261.977 231.773 329 149.311 329V274.357C201.673 274.357 244.121 231.798 244.121 179.299Z" fill="#fefaf3"/>
          </svg>
        </div>
        
        <nav style={styles.navLinks}>
          {navItems.map((item) => (
            <div 
              key={item} 
              style={styles.navLink}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.9')}
            >
              {item} <span style={styles.dropdownArrow}>▼</span>
            </div>
          ))}
        </nav>
      </div>

      <div style={styles.centerSection}>
        <form style={styles.searchContainer} onSubmit={handleSearchSubmit}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search Outsome"
            style={styles.searchInput}
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </form>
      </div>

      <div style={styles.rightSection}>
        <div 
          style={styles.notificationContainer} 
          onClick={onNotificationClick}
          title="Notifications"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          
          {notificationCount > 0 && (
            <div style={styles.badge}>
              {notificationCount > 99 ? '99+' : notificationCount}
            </div>
          )}
        </div>

        <img 
          src={userAvatarUrl} 
          alt={userName} 
          style={styles.avatar} 
          onClick={onProfileClick}
          title={userName}
        />
      </div>
    </header>
  );
};

export default BookfaceHeader;
