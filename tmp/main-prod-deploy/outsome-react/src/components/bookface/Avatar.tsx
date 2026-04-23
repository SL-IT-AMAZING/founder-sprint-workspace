import React, { useMemo, useState } from 'react';
import './bookface.css';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  badge?: string;
  showBadge?: boolean;
  onClick?: () => void;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  badge,
  showBadge = false,
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const pixelSize = sizeMap[size];

  const initials = useMemo(() => {
    if (!alt) return '?';
    const parts = alt.trim().split(/\s+/);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }, [alt]);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: `${pixelSize}px`,
    height: `${pixelSize}px`,
    cursor: onClick ? 'pointer' : 'default',
    opacity: onClick && isHovered ? 0.9 : 1,
    transition: 'opacity 0.2s ease-in-out',
    display: 'inline-block',
    verticalAlign: 'middle',
  };

  const commonStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: '1px solid rgba(0,0,0,0.1)',
    boxSizing: 'border-box',
    objectFit: 'cover',
  };

  const fallbackStyle: React.CSSProperties = {
    ...commonStyle,
    backgroundColor: '#e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
    fontSize: `${pixelSize * 0.45}px`,
    fontWeight: 'bold',
    userSelect: 'none',
    fontFamily: 'var(--bf-font-family, sans-serif)',
  };

  const badgeStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    backgroundColor: 'var(--bf-primary, #555AB9)',
    color: 'white',
    fontSize: '9px',
    fontWeight: 'bold',
    borderRadius: '3px',
    padding: '1px 4px',
    zIndex: 10,
    lineHeight: '1.2',
    fontFamily: 'var(--bf-font-family, sans-serif)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      style={containerStyle}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          onClick();
          e.preventDefault();
        }
      }}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={alt}
          style={commonStyle}
          onError={() => setImgError(true)}
        />
      ) : (
        <div style={fallbackStyle} aria-label={alt}>
          {initials}
        </div>
      )}

      {showBadge && badge && (
        <div style={badgeStyle}>
          {badge}
        </div>
      )}
    </div>
  );
};
