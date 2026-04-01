import React from 'react';

export interface Photo {
  id: string;
  url: string;
  caption?: string;
  takenAt?: string;
}

export interface PhotosGalleryProps {
  photos: Photo[];
  maxDisplay?: number;
  onViewAll?: () => void;
  onPhotoClick?: (photo: Photo) => void;
}

export const PhotosGallery: React.FC<PhotosGalleryProps> = ({
  photos,
  maxDisplay = 5,
  onViewAll,
  onPhotoClick,
}) => {
  const displayPhotos = photos.slice(0, maxDisplay);

  const styles = {
    container: {
      marginBottom: '24px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    },
    title: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#000',
      margin: 0,
    },
    viewAll: {
      fontSize: '14px',
      color: '#1A1A1A',
      textDecoration: 'none',
      cursor: 'pointer',
      fontWeight: 500,
      background: 'none',
      border: 'none',
      padding: 0,
    },
    scrollContainer: {
      display: 'flex',
      overflowX: 'auto' as const,
      gap: '12px',
      paddingBottom: '8px',
      scrollbarWidth: 'thin' as const,
    },
    photoWrapper: {
      flex: '0 0 auto',
      width: '150px',
      height: '100px',
      borderRadius: '8px',
      overflow: 'hidden',
      cursor: 'pointer',
      position: 'relative' as const,
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      border: '1px solid #e0e0e0',
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
      display: 'block',
    },
  };

  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Photos</h3>
        {onViewAll && (
          <button 
            style={styles.viewAll} 
            onClick={onViewAll}
            type="button"
          >
            View All
          </button>
        )}
      </div>
      
      <div style={styles.scrollContainer}>
        {displayPhotos.map((photo) => {
          const isHovered = hoveredId === photo.id;
          const currentWrapperStyle = {
            ...styles.photoWrapper,
            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
            boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
          };

          return (
            <div
              key={photo.id}
              style={currentWrapperStyle}
              onClick={() => onPhotoClick?.(photo)}
              onMouseEnter={() => setHoveredId(photo.id)}
              onMouseLeave={() => setHoveredId(null)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onPhotoClick?.(photo);
                }
              }}
            >
              <img 
                src={photo.url} 
                alt={photo.caption || 'Gallery photo'} 
                style={styles.image}
              />
            </div>
          );
        })}
        {photos.length === 0 && (
          <div style={{ color: '#666', fontSize: '14px', fontStyle: 'italic', padding: '12px 0' }}>
            No photos to display
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotosGallery;
