import React, { useState } from 'react';

export interface CompanyCardProps {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  batch?: string;
  industryTags?: string[];
  teamMembers?: { name: string; avatarUrl?: string }[];
  onClick?: () => void;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({
  name,
  description,
  logoUrl,
  batch,
  industryTags = [],
  teamMembers = [],
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const styles = {
    card: {
      display: 'flex',
      flexDirection: 'row' as const,
      alignItems: 'center',
      padding: '16px',
      backgroundColor: isHovered ? '#f9f9f9' : '#ffffff',
      borderBottom: '1px solid #e0e0e0',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'background-color 0.15s ease-in-out',
      boxSizing: 'border-box' as const,
    },
    logoContainer: {
      width: '48px',
      height: '48px',
      borderRadius: '8px',
      overflow: 'hidden',
      marginRight: '16px',
      flexShrink: 0,
      backgroundColor: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #eee',
    },
    logoImage: {
      width: '100%',
      height: '100%',
      objectFit: 'contain' as const,
    },
    fallbackLogo: {
      fontSize: '20px',
      fontWeight: 600,
      color: '#888',
      textTransform: 'uppercase' as const,
    },
    content: {
      display: 'flex',
      flexDirection: 'column' as const,
      flexGrow: 1,
      minWidth: 0, // Critical for text truncation: enables flex item shrinking
      marginRight: '16px',
    },
    headerRow: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '4px',
      gap: '8px',
    },
    name: {
      fontSize: '16px',
      fontWeight: 600,
      color: '#1a1a1a',
      textDecoration: 'none',
      lineHeight: '1.2',
    },
    batchBadge: {
      display: 'inline-block',
      backgroundColor: '#f1eadd',
      color: '#2F2C26',
      fontSize: '12px',
      fontWeight: 500,
      padding: '2px 6px',
      borderRadius: '4px',
      whiteSpace: 'nowrap' as const,
      lineHeight: '1.2',
    },
    description: {
      fontSize: '14px',
      color: '#666666',
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      marginBottom: '6px',
      lineHeight: '1.4',
    },
    tagsRow: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '8px',
      marginTop: '2px',
    },
    tag: {
      backgroundColor: '#f0f0f0',
      color: '#555',
      fontSize: '11px',
      fontWeight: 500,
      textTransform: 'uppercase' as const,
      padding: '2px 6px',
      borderRadius: '4px',
      letterSpacing: '0.02em',
    },
    teamContainer: {
      display: 'flex',
      alignItems: 'center',
      paddingLeft: '8px',
      flexShrink: 0,
    },
    avatar: (index: number) => ({
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      border: '2px solid #ffffff',
      backgroundColor: '#ddd',
      marginLeft: index > 0 ? '-10px' : '0',
      zIndex: 10 + index,
      objectFit: 'cover' as const,
      overflow: 'hidden',
    }),
    avatarImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
    },
    avatarFallback: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ccc',
        color: '#fff',
        fontSize: '10px',
        fontWeight: 600,
    }
  };

  return (
    <div 
      style={styles.card}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div style={styles.logoContainer}>
        {logoUrl && !imgError ? (
          <img 
            src={logoUrl} 
            alt={`${name} logo`} 
            style={styles.logoImage} 
            onError={() => setImgError(true)}
          />
        ) : (
          <span style={styles.fallbackLogo}>
            {name.charAt(0)}
          </span>
        )}
      </div>

      <div style={styles.content}>
        <div style={styles.headerRow}>
          <span style={styles.name}>{name}</span>
          {batch && (
            <span style={styles.batchBadge}>{batch}</span>
          )}
        </div>
        
        <div style={styles.description} title={description}>
          {description}
        </div>

        {industryTags.length > 0 && (
          <div style={styles.tagsRow}>
            {industryTags.map((tag, index) => (
              <span key={index} style={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {teamMembers.length > 0 && (
        <div style={styles.teamContainer}>
          {teamMembers.slice(0, 5).map((member, index) => (
            <div key={index} style={styles.avatar(index)} title={member.name}>
                 {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.name} style={styles.avatarImg} />
                 ) : (
                    <div style={styles.avatarFallback}>{member.name.charAt(0)}</div>
                 )}
            </div>
          ))}
          {teamMembers.length > 5 && (
              <div style={{...styles.avatar(5), ...styles.avatarFallback, backgroundColor: '#f0f0f0', color: '#666', fontSize: '10px'}}>
                  +{teamMembers.length - 5}
              </div>
          )}
        </div>
      )}
    </div>
  );
};
