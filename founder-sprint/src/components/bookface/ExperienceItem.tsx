import React, { useState } from 'react';

export interface ExperienceItemProps {
  id: string;
  role: string;
  companyName: string;
  companyLogoUrl?: string;
  companyId?: string;
  startDate: string;
  endDate?: string;
  duration?: string;
  location?: string;
  description?: string;
  isEditable?: boolean;
  onEdit?: () => void;
  onCompanyClick?: () => void;
}

export const ExperienceItem: React.FC<ExperienceItemProps> = ({
  role,
  companyName,
  companyLogoUrl,
  startDate,
  endDate = 'Present',
  duration,
  location,
  description,
  isEditable = false,
  onEdit,
  onCompanyClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Styling Tokens
  const colors = {
    primary: '#1A1A1A',
    textPrimary: '#2F2C26',
    textSecondary: '#666666',
    textMuted: '#999999',
    border: '#e0e0e0',
    separator: '#f0f0f0',
    bgHover: '#f9f9f9',
  };

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: '16px 0',
      borderBottom: `1px solid ${colors.separator}`,
      width: '100%',
    },
    logoContainer: {
      flexShrink: 0,
      width: '40px',
      height: '40px',
      marginRight: '12px',
      borderRadius: '6px',
      overflow: 'hidden',
      backgroundColor: '#f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `1px solid ${colors.border}`,
    },
    logoImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    logoFallback: {
      fontSize: '18px',
      fontWeight: 600,
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    content: {
      flex: 1,
      minWidth: 0, // Enables text truncation in flex children if needed
    },
    headerRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '2px',
    },
    role: {
      fontSize: '15px',
      fontWeight: 600,
      color: colors.textPrimary,
      margin: 0,
      lineHeight: '1.4',
    },
    companyRow: {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '4px',
      marginBottom: '2px',
      fontSize: '14px',
    },
    companyLink: {
      color: colors.primary,
      textDecoration: 'none',
      cursor: onCompanyClick ? 'pointer' : 'default',
      fontWeight: 500,
    },
    metaRow: {
      fontSize: '13px',
      color: colors.textSecondary,
      marginTop: '2px',
      lineHeight: '1.4',
    },
    bullet: {
      margin: '0 4px',
      color: colors.textMuted,
    },
    description: {
      marginTop: '8px',
      fontSize: '14px',
      color: colors.textPrimary,
      lineHeight: '1.5',
      whiteSpace: 'pre-wrap',
    },
    descriptionTruncated: {
      display: '-webkit-box',
      WebkitLineClamp: 3,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    },
    showMoreBtn: {
      background: 'none',
      border: 'none',
      padding: 0,
      marginTop: '4px',
      fontSize: '13px',
      color: colors.primary,
      cursor: 'pointer',
      fontWeight: 500,
    },
    editButton: {
      background: 'none',
      border: 'none',
      fontSize: '13px',
      color: colors.primary,
      cursor: 'pointer',
      fontWeight: 500,
      marginLeft: '12px',
      whiteSpace: 'nowrap',
    },
  };

  const companyInitial = companyName.charAt(0);

  // Determine if we need truncation (rough estimate based on length or just always render logic)
  // For a truly robust "Show More" only when needed, we'd need useLayoutEffect/ResizeObserver.
  // For this simplified version, we'll assume long descriptions need it.
  const isLongDescription = description && description.length > 150; 

  return (
    <div style={styles.container}>
      {/* Logo Section */}
      <div style={styles.logoContainer}>
        {companyLogoUrl ? (
          <img src={companyLogoUrl} alt={`${companyName} logo`} style={styles.logoImage} />
        ) : (
          <span style={styles.logoFallback}>{companyInitial}</span>
        )}
      </div>

      {/* Content Section */}
      <div style={styles.content}>
        <div style={styles.headerRow}>
          <div>
            <h3 style={styles.role}>{role}</h3>
            <div style={styles.companyRow}>
              <a 
                href="#" 
                style={styles.companyLink}
                onClick={(e) => {
                  e.preventDefault();
                  onCompanyClick?.();
                }}
              >
                {companyName}
              </a>
            </div>
          </div>
          
          {/* Edit Button (Top Right aligned with role) */}
          {isEditable && (
            <button 
              style={styles.editButton}
              onClick={onEdit}
              aria-label={`Edit ${role} at ${companyName}`}
            >
              Edit
            </button>
          )}
        </div>

        {/* Date & Meta Data */}
        <div style={styles.metaRow}>
          <span>
            {startDate} – {endDate}
          </span>
          {duration && (
            <>
              <span style={styles.bullet}>•</span>
              <span>{duration}</span>
            </>
          )}
          {location && (
            <>
              <span style={styles.bullet}>•</span>
              <span>{location}</span>
            </>
          )}
        </div>

        {/* Description */}
        {description && (
          <div>
            <div 
              style={{
                ...styles.description,
                ...( (!isExpanded && isLongDescription) ? styles.descriptionTruncated : {} )
              }}
            >
              {description}
            </div>
            {isLongDescription && (
              <button 
                style={styles.showMoreBtn}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExperienceItem;
