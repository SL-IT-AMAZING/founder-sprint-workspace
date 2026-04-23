import React from 'react';


interface BatchBadgeProps {
  batch: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline';
  className?: string;
  style?: React.CSSProperties;
}

export const BatchBadge: React.FC<BatchBadgeProps> = ({
  batch,
  size = 'md',
  variant = 'default',
  className = '',
  style = {},
}) => {
  const baseStyles: React.CSSProperties = {
    fontWeight: 700,
    textTransform: 'uppercase',
    borderRadius: '3px',
    display: 'inline-block',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      fontSize: '9px',
      padding: '2px 4px',
    },
    md: {
      fontSize: '11px',
      padding: '3px 6px',
    },
    lg: {
      fontSize: '13px',
      padding: '4px 8px',
    },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: '#1A1A1A',
      color: 'white',
      border: 'none',
    },
    outline: {
      backgroundColor: 'transparent',
      border: '1px solid #1A1A1A',
      color: '#1A1A1A',
    },
  };

  const combinedStyles = {
    ...baseStyles,
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  };

  return (
    <span
      className={`batch-badge ${className}`}
      style={combinedStyles}
      aria-label={`YC Batch ${batch}`}
    >
      {batch}
    </span>
  );
};
