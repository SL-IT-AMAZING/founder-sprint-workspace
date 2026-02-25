import React from 'react';

export interface PersonListItemProps {
  id: string;
  name: string;
  avatarUrl?: string;
  batch?: string;
  currentRole?: string;
  currentCompany?: string;
  currentCompanyId?: string;
  startDate?: string;
  location?: string;
  previousCompanies?: { name: string; id: string }[];
  linkedInUrl?: string;
  onProfileClick?: () => void;
  onCompanyClick?: (companyId: string) => void;
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '16px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#ffffff',
    transition: 'background-color 0.15s ease',
    cursor: 'default',
  },
  avatarContainer: {
    marginRight: '16px',
    flexShrink: 0,
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '4px',
    objectFit: 'cover' as const,
    backgroundColor: '#f0f0f0',
  },
  contentContainer: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  headerLine: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginBottom: '2px',
  },
  name: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#2F2C26',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'color 0.15s ease',
  },
  batchBadge: {
    backgroundColor: '#f1eadd',
    color: '#cf7a2a',
    fontSize: '12px',
    fontWeight: 500,
    padding: '2px 6px',
    borderRadius: '4px',
    lineHeight: 1,
  },
  roleLine: {
    fontSize: '14px',
    color: '#2F2C26',
  },
  companyLink: {
    color: '#1A1A1A',
    textDecoration: 'none',
    fontWeight: 500,
    cursor: 'pointer',
  },
  metaLine: {
    fontSize: '13px',
    color: '#666666',
    lineHeight: '1.4',
    marginTop: '2px',
  },
  metaSeparator: {
    margin: '0 4px',
  },
  previousLink: {
    color: '#1A1A1A',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  linkedInContainer: {
    marginLeft: '16px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '4px',
  },
  linkedInIcon: {
    width: '16px',
    height: '16px',
    fill: '#0077b5',
    cursor: 'pointer',
  },
  noAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666666',
    fontSize: '18px',
    fontWeight: 'bold',
  }
};

const hoverStyles = {
  container: {
    backgroundColor: '#f9f9f9',
  },
  name: {
    color: '#1A1A1A',
  },
  companyLink: {
    textDecoration: 'underline',
  },
  previousLink: {
    textDecoration: 'underline',
  }
};

export const PersonListItem: React.FC<PersonListItemProps> = ({
  id,
  name,
  avatarUrl,
  batch,
  currentRole,
  currentCompany,
  currentCompanyId,
  startDate,
  location,
  previousCompanies = [],
  linkedInUrl,
  onProfileClick,
  onCompanyClick,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const handleCompanyClick = (e: React.MouseEvent, companyId?: string) => {
    e.stopPropagation();
    if (onCompanyClick && companyId) {
      onCompanyClick(companyId);
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onProfileClick) {
      onProfileClick();
    }
  };

  const handleLinkedInClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const hasPrevious = previousCompanies.length > 0;
  const firstPrevious = hasPrevious ? previousCompanies[0] : null;
  const remainingPreviousCount = hasPrevious ? previousCompanies.length - 1 : 0;

  return (
    <div
      style={{
        ...styles.container,
        ...(isHovered ? hoverStyles.container : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.avatarContainer}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${name}'s avatar`}
            style={styles.avatar}
            onClick={handleProfileClick}
          />
        ) : (
          <div style={styles.noAvatar} onClick={handleProfileClick}>
            {name.charAt(0)}
          </div>
        )}
      </div>

      <div style={styles.contentContainer}>
        
        <div style={styles.headerLine}>
          <a
            href={`#profile/${id}`}
            onClick={handleProfileClick}
            style={{
              ...styles.name,
              ...(isHovered ? hoverStyles.name : {}),
            }}
          >
            {name}
          </a>
          {batch && (
            <span style={{
              ...styles.batchBadge,
              color: '#2F2C26' 
            }}>
              {batch}
            </span>
          )}
        </div>

        {(currentRole || currentCompany) && (
          <div style={styles.roleLine}>
            {currentRole}
            {currentRole && currentCompany && ' at '}
            {currentCompany && (
              <span
                style={{
                  ...styles.companyLink,
                  ...(isHovered ? hoverStyles.companyLink : {}),
                }}
                onClick={(e) => handleCompanyClick(e, currentCompanyId)}
              >
                {currentCompany}
              </span>
            )}
          </div>
        )}

        <div style={styles.metaLine}>
          {startDate && (
            <>
              <span>{startDate} - Present</span>
              {(location || hasPrevious) && <span style={styles.metaSeparator}>·</span>}
            </>
          )}
          
          {location && (
            <>
              <span>{location}</span>
              {hasPrevious && <span style={styles.metaSeparator}>·</span>}
            </>
          )}

          {hasPrevious && firstPrevious && (
            <>
              <span>Previously at </span>
              <span
                style={{
                  ...styles.previousLink,
                  ...(isHovered ? hoverStyles.previousLink : {}),
                }}
                onClick={(e) => handleCompanyClick(e, firstPrevious.id)}
              >
                {firstPrevious.name}
              </span>
              {remainingPreviousCount > 0 && (
                <span>, {remainingPreviousCount} more</span>
              )}
            </>
          )}
        </div>
      </div>

      {linkedInUrl && (
        <div style={styles.linkedInContainer}>
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLinkedInClick}
            title="LinkedIn Profile"
          >
            <svg
              viewBox="0 0 24 24"
              style={styles.linkedInIcon}
            >
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
};
