import React from 'react';
import './bookface.css';

export interface TagBadgeProps {
  label: string;
  color?: 'gray' | 'blue' | 'green' | 'orange' | 'purple';
  size?: 'sm' | 'md';
  onClick?: () => void;
}

export const TagBadge: React.FC<TagBadgeProps> = ({
  label,
  color = 'gray',
  size = 'md',
  onClick,
}) => {
  const isClickable = !!onClick;

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    textTransform: 'uppercase',
    borderRadius: '3px',
    letterSpacing: '0.5px',
    border: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    cursor: isClickable ? 'pointer' : 'default',
    transition: 'background-color 0.1s ease',
    whiteSpace: 'nowrap',
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      fontSize: '9px',
      padding: '1px 4px',
    },
    md: {
      fontSize: '10px',
      padding: '2px 6px',
    },
  };

  const colorStyles: Record<string, { background: string; color: string; hoverBackground: string }> = {
    gray: { background: '#f0f0f0', color: '#555555', hoverBackground: '#e0e0e0' },
    blue: { background: '#e8f4fc', color: '#0066cc', hoverBackground: '#dbeeff' },
    green: { background: '#e8f8e8', color: '#22a822', hoverBackground: '#d6f0d6' },
    orange: { background: '#f1eadd', color: '#2F2C26', hoverBackground: '#e8dcc8' },
    purple: { background: 'rgba(85, 90, 185, 0.1)', color: '#555AB9', hoverBackground: 'rgba(85, 90, 185, 0.15)' },
  };

  const currentSize = sizeStyles[size];
  const currentColor = colorStyles[color];
  const [isHovered, setIsHovered] = React.useState(false);

  const combinedStyles: React.CSSProperties = {
    ...baseStyles,
    ...currentSize,
    backgroundColor: isClickable && isHovered ? currentColor.hoverBackground : currentColor.background,
    color: currentColor.color,
  };

  return (
    <span
      style={combinedStyles}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {label}
    </span>
  );
};
