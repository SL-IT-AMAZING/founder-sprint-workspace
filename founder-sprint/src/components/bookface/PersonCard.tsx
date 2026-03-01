import React, { useState } from 'react';

export interface PersonCardProps {
  name: string;
  avatarUrl?: string;
  batch?: string;
  company?: string;
  role?: string;
  isFollowing?: boolean;
  onFollowClick?: () => void;
  onProfileClick?: () => void;
}

export const PersonCard: React.FC<PersonCardProps> = ({
  name,
  avatarUrl,
  batch,
  company,
  role,
  isFollowing = false,
  onFollowClick,
  onProfileClick,
}) => {
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  const styles = {
    container: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px',
      gap: '12px',
      backgroundColor: isCardHovered ? '#f9f9f9' : '#ffffff',
      borderBottom: '1px solid #e0e0e0',
      cursor: onProfileClick ? 'pointer' : 'default',
      transition: 'background-color 0.2s ease',
    } as React.CSSProperties,
    avatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#eeeeee',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      fontWeight: 500,
      color: '#666666',
      flexShrink: 0,
      ...(avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : {}),
    } as React.CSSProperties,
    info: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      overflow: 'hidden',
    } as React.CSSProperties,
    nameRow: {
      display: 'flex',
      alignItems: 'baseline',
      gap: '6px',
    } as React.CSSProperties,
    name: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#1a1a1a',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    } as React.CSSProperties,
    batch: {
      fontSize: '9px',
      color: '#1A1A1A',
      fontWeight: 700,
      backgroundColor: 'rgba(26, 26, 26, 0.1)',
      padding: '1px 4px',
      borderRadius: '3px',
    } as React.CSSProperties,
    meta: {
      fontSize: '12px',
      color: '#666666',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    } as React.CSSProperties,
    button: {
      padding: '4px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: isFollowing ? '1px solid #1A1A1A' : '1px solid #1A1A1A',
      backgroundColor: isFollowing 
        ? (isButtonHovered ? '#333333' : '#1A1A1A') 
        : (isButtonHovered ? 'rgba(26, 26, 26, 0.05)' : 'transparent'),
      color: isFollowing ? '#ffffff' : '#1A1A1A',
      whiteSpace: 'nowrap',
    } as React.CSSProperties,
  };

  const getInitials = (n: string) => {
    return n
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFollowClick?.();
  };

  return (
    <div
      style={styles.container}
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
      onClick={onProfileClick}
    >
      <div style={styles.avatar}>
        {!avatarUrl && getInitials(name)}
      </div>
      
      <div style={styles.info}>
        <div style={styles.nameRow}>
          <span style={styles.name}>{name}</span>
          {batch && <span style={styles.batch}>{batch}</span>}
        </div>
        {(company || role) && (
          <div style={styles.meta}>
            {role && company ? `${role} at ${company}` : (role || company)}
          </div>
        )}
      </div>

      <button
        style={styles.button}
        onMouseEnter={() => setIsButtonHovered(true)}
        onMouseLeave={() => setIsButtonHovered(false)}
        onClick={handleFollowClick}
      >
        {isFollowing ? 'Following' : 'Follow'}
      </button>
    </div>
  );
};
