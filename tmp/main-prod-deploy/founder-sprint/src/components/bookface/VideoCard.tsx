import React, { useState } from 'react';

export interface VideoCardProps {
  id: string;
  title: string;
  thumbnailUrl: string;
  duration: string;
  views: number;
  publishedAt: string;
  showBadge?: boolean;
  onClick?: () => void;
}

const formatViews = (views: number): string => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(0)}K`;
  }
  return views.toString();
};

export const VideoCard: React.FC<VideoCardProps> = ({
  title,
  thumbnailUrl,
  duration,
  views,
  publishedAt,
  showBadge = false,
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const styles = {
    container: {
      cursor: 'pointer',
    },
    thumbnailWrapper: {
      position: 'relative' as const,
      borderRadius: '8px',
      overflow: 'hidden',
      marginBottom: '12px',
    },
    thumbnail: {
      width: '100%',
      height: '180px',
      objectFit: 'cover' as const,
      display: 'block',
      transform: isHovered ? 'scale(1.03)' : 'scale(1)',
      transition: 'transform 0.2s ease',
    },
    durationBadge: {
      position: 'absolute' as const,
      bottom: '8px',
      right: '8px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      fontSize: '12px',
      fontWeight: 600,
      padding: '2px 6px',
      borderRadius: '4px',
    },
    brandBadge: {
      position: 'absolute' as const,
      top: '8px',
      right: '8px',
      backgroundColor: '#ff6600',
      color: 'white',
      width: '24px',
      height: '24px',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: 700,
    },
    title: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#2F2C26',
      marginBottom: '4px',
      lineHeight: 1.4,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical' as const,
      overflow: 'hidden',
    },
    meta: {
      fontSize: '12px',
      color: '#666666',
    },
  };

  return (
    <div
      style={styles.container}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.thumbnailWrapper}>
        <img src={thumbnailUrl} alt={title} style={styles.thumbnail} />
        <div style={styles.durationBadge}>{duration}</div>
        {showBadge && <div style={styles.brandBadge}>O</div>}
      </div>
      
      <div style={styles.title}>{title}</div>
      
      <div style={styles.meta}>
        {formatViews(views)} views · {publishedAt}
      </div>
    </div>
  );
};
