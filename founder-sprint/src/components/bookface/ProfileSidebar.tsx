import React, { useState } from 'react';

export interface ProfileSidebarProps {
  type: 'user' | 'company';
  founded?: string | number;
  batches?: string[];
  locations?: string[];
  website?: string;
  email?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    github?: string;
  };
  employees?: number;
  onShowContactInfo?: () => void;
  onReportSpam?: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  type,
  founded,
  batches,
  locations,
  website,
  email,
  socialLinks,
  employees,
  onShowContactInfo,
  onReportSpam,
  onBookmark,
  isBookmarked = false,
}) => {
  const [hoveredButton, setHoveredButton] = useState(false);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const colors = {
    primary: '#1A1A1A',
    cardBg: '#ffffff',
    border: '#e0e0e0',
    textPrimary: '#2F2C26',
    textSecondary: '#666666',
    link: '#1A1A1A',
    hoverBg: '#f5f5f5',
  };

  const styles = {
    container: {
      backgroundColor: colors.cardBg,
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      padding: '20px',
      width: '100%',
      maxWidth: '300px',
      boxSizing: 'border-box' as const,
    },
    row: {
      display: 'flex',
      marginBottom: '12px',
      alignItems: 'baseline',
      fontSize: '14px',
      lineHeight: '1.5',
    },
    label: {
      color: colors.textSecondary,
      width: '80px',
      flexShrink: 0,
    },
    value: {
      color: colors.textPrimary,
      fontWeight: 500,
    },
    link: {
      color: colors.link,
      textDecoration: 'none',
      cursor: 'pointer',
    },
    socialRow: {
      display: 'flex',
      gap: '12px',
      marginTop: '20px',
      marginBottom: '20px',
    },
    socialIcon: {
      width: '20px',
      height: '20px',
      fill: colors.textSecondary,
      cursor: 'pointer',
      transition: 'fill 0.2s',
    },
    button: {
      width: '100%',
      padding: '8px 16px',
      backgroundColor: hoveredButton ? colors.hoverBg : 'transparent',
      border: `1px solid ${colors.border}`,
      borderRadius: '4px',
      color: colors.textPrimary,
      fontWeight: 600,
      fontSize: '14px',
      cursor: 'pointer',
      marginBottom: '16px',
      transition: 'background-color 0.2s',
    },
    actionRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '12px',
      borderTop: `1px solid ${colors.border}`,
      paddingTop: '12px',
    },
    actionLink: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      color: colors.textSecondary,
      fontSize: '13px',
      textDecoration: 'none',
      cursor: 'pointer',
      background: 'none',
      border: 'none',
      padding: 0,
    },
    actionIcon: {
      width: '14px',
      height: '14px',
      fill: colors.textSecondary,
    },
  };

  const Icons = {
    LinkedIn: (
      <svg viewBox="0 0 24 24" style={styles.socialIcon}>
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
      </svg>
    ),
    Facebook: (
      <svg viewBox="0 0 24 24" style={styles.socialIcon}>
        <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
      </svg>
    ),
    Twitter: (
      <svg viewBox="0 0 24 24" style={styles.socialIcon}>
        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
      </svg>
    ),
    Github: (
      <svg viewBox="0 0 24 24" style={styles.socialIcon}>
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
    Flag: (
      <svg viewBox="0 0 24 24" style={styles.actionIcon}>
        <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
      </svg>
    ),
    Bookmark: (
      <svg viewBox="0 0 24 24" style={{...styles.actionIcon, fill: isBookmarked ? colors.primary : colors.textSecondary}}>
        <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
      </svg>
    ),
  };

  return (
    <div style={styles.container}>
      {founded && (
        <div style={styles.row}>
          <span style={styles.label}>Founded:</span>
          <span style={styles.value}>
            {typeof founded === 'string' && founded.includes('company') ? (
              <a href="#" style={styles.link}>{founded}</a>
            ) : (
              founded
            )}
          </span>
        </div>
      )}

      {type === 'user' && batches && batches.length > 0 && (
        <div style={styles.row}>
          <span style={styles.label}>Batches:</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {batches.map((batch, index) => (
              <a key={index} href={`/batch/${batch}`} style={styles.link}>
                {batch}
              </a>
            ))}
          </div>
        </div>
      )}

      {type === 'company' && employees !== undefined && (
        <div style={styles.row}>
          <span style={styles.label}>Employees:</span>
          <span style={styles.value}>{employees}</span>
        </div>
      )}

      {locations && locations.length > 0 && (
        <div style={styles.row}>
          <span style={styles.label}>Locations:</span>
          <span style={styles.value}>{locations.join(', ')}</span>
        </div>
      )}

      {type === 'company' && website && (
        <div style={styles.row}>
          <span style={styles.label}>Website:</span>
          <a href={website} target="_blank" rel="noopener noreferrer" style={styles.link}>
            {website.replace(/^https?:\/\//, '')}
          </a>
        </div>
      )}

      {type === 'company' && email && (
        <div style={styles.row}>
          <span style={styles.label}>Contact:</span>
          <a href={`mailto:${email}`} style={styles.link}>
            {email}
          </a>
        </div>
      )}

      {socialLinks && (
        <div style={styles.socialRow}>
          {socialLinks.linkedin && (
            <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn">
              {Icons.LinkedIn}
            </a>
          )}
          {socialLinks.facebook && (
            <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" title="Facebook">
              {Icons.Facebook}
            </a>
          )}
          {socialLinks.twitter && (
            <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" title="Twitter">
              {Icons.Twitter}
            </a>
          )}
          {socialLinks.github && (
            <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" title="GitHub">
              {Icons.Github}
            </a>
          )}
        </div>
      )}

      {onShowContactInfo && (
        <button
          style={styles.button}
          onClick={onShowContactInfo}
          onMouseEnter={() => setHoveredButton(true)}
          onMouseLeave={() => setHoveredButton(false)}
        >
          Show Contact Info
        </button>
      )}

      <div style={styles.actionRow}>
        <button
          style={styles.actionLink}
          onClick={onReportSpam}
          onMouseEnter={() => setHoveredAction('spam')}
          onMouseLeave={() => setHoveredAction(null)}
        >
          <span style={{ ...styles.actionIcon, fill: hoveredAction === 'spam' ? colors.textPrimary : colors.textSecondary }}>
            {Icons.Flag}
          </span>
          <span style={{ color: hoveredAction === 'spam' ? colors.textPrimary : colors.textSecondary }}>
            Report Spam
          </span>
        </button>
        <button
          style={styles.actionLink}
          onClick={onBookmark}
          onMouseEnter={() => setHoveredAction('bookmark')}
          onMouseLeave={() => setHoveredAction(null)}
        >
          <span style={{ 
            ...styles.actionIcon, 
            fill: isBookmarked ? colors.primary : (hoveredAction === 'bookmark' ? colors.textPrimary : colors.textSecondary) 
          }}>
            {Icons.Bookmark}
          </span>
          <span style={{ 
            color: isBookmarked ? colors.primary : (hoveredAction === 'bookmark' ? colors.textPrimary : colors.textSecondary) 
          }}>
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </span>
        </button>
      </div>
    </div>
  );
};
