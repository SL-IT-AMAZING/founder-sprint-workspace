import React from 'react';

export interface EducationItemProps {
  id: string;
  degree: string;
  fieldOfStudy?: string;
  schoolName: string;
  schoolLogoUrl?: string;
  startYear: string;
  endYear?: string;
  isEditable?: boolean;
  onEdit?: () => void;
  onSchoolClick?: () => void;
}

export const EducationItem: React.FC<EducationItemProps> = ({
  degree,
  fieldOfStudy,
  schoolName,
  schoolLogoUrl,
  startYear,
  endYear,
  isEditable = false,
  onEdit,
  onSchoolClick
}) => {
  const styles = {
    container: {
      display: 'flex',
      alignItems: 'flex-start',
      padding: '16px 0',
      borderBottom: '1px solid #f0f0f0',
      width: '100%',
    },
    logoContainer: {
      width: '40px',
      height: '40px',
      borderRadius: '4px',
      backgroundColor: '#f5f5f5',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '12px',
      flexShrink: 0,
      overflow: 'hidden',
    },
    logoImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
    },
    fallbackLogo: {
      fontSize: '20px',
      color: '#999',
      fontWeight: 'bold',
    },
    contentContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      flexGrow: 1,
      minWidth: 0,
    },
    degreeLine: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#2F2C26',
      marginBottom: '2px',
      lineHeight: '1.4',
    },
    schoolLine: {
      fontSize: '14px',
      color: '#1A1A1A',
      textDecoration: 'none',
      cursor: onSchoolClick ? 'pointer' : 'default',
      marginBottom: '2px',
      lineHeight: '1.4',
    },
    dateLine: {
      fontSize: '13px',
      color: '#666666',
      lineHeight: '1.4',
    },
    editButtonContainer: {
      marginLeft: '12px',
      flexShrink: 0,
    },
    editButton: {
      background: 'none',
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      padding: '4px 10px',
      fontSize: '12px',
      fontWeight: '500',
      color: '#666666',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    }
  };

  const formattedDegree = fieldOfStudy ? `${degree}, ${fieldOfStudy}` : degree;
  const dateRange = endYear ? `${startYear} - ${endYear}` : startYear;

  return (
    <div style={styles.container}>
      <div style={styles.logoContainer}>
        {schoolLogoUrl ? (
          <img src={schoolLogoUrl} alt={`${schoolName} logo`} style={styles.logoImage} />
        ) : (
          <span style={styles.fallbackLogo}>U</span>
        )}
      </div>
      
      <div style={styles.contentContainer}>
        <div style={styles.degreeLine}>
          {formattedDegree}
        </div>
        
        <div 
          style={styles.schoolLine}
          onClick={onSchoolClick}
          role={onSchoolClick ? "button" : undefined}
        >
          {schoolName}
        </div>
        
        <div style={styles.dateLine}>
          {dateRange}
        </div>
      </div>

      {isEditable && (
        <div style={styles.editButtonContainer}>
          <button 
            style={styles.editButton}
            onClick={onEdit}
            type="button"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
};
