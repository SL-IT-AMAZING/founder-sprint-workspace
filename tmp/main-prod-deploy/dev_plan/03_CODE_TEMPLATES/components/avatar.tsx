import { type ReactNode } from 'react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-[60px] h-[60px] text-base',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-[#f5d0c5]',
    'bg-[#d4e4bc]',
    'bg-[#b8d4e3]',
    'bg-[#e3c4d4]',
    'bg-[#dce4b8]',
    'bg-[#c5e4d4]',
    'bg-[#e4d4b8]',
    'bg-[#c4d4e4]',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ src, alt, name = '', size = 'md', className = '' }: AvatarProps) {
  const sizeClass = sizeStyles[size];
  
  if (src) {
    return (
      <img
        src={src}
        alt={alt || name}
        className={`
          ${sizeClass}
          rounded-full
          object-cover
          border-2 border-[#fefaf3]
          ${className}
        `}
      />
    );
  }

  const colorClass = getColorFromName(name);
  const initials = getInitials(name || '?');

  return (
    <div
      className={`
        ${sizeClass}
        ${colorClass}
        rounded-full
        flex items-center justify-center
        font-medium
        border-2 border-[#fefaf3]
        ${className}
      `}
    >
      {initials}
    </div>
  );
}

interface AvatarGroupProps {
  avatars: Array<{
    src?: string | null;
    name?: string;
  }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

const overlapStyles = {
  sm: '-mr-2',
  md: '-mr-[6px]',
  lg: '-mr-3',
};

export function AvatarGroup({ avatars, max = 4, size = 'md' }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;
  const overlapClass = overlapStyles[size];

  return (
    <div className="flex pr-[6px]">
      {visible.map((avatar, index) => (
        <div key={index} className={overlapClass}>
          <Avatar
            src={avatar.src}
            name={avatar.name}
            size={size}
          />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={`
            ${sizeStyles[size]}
            ${overlapClass}
            rounded-full
            flex items-center justify-center
            bg-[#2f2c250f]
            border-2 border-[#fefaf3]
            font-medium
          `}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

export default Avatar;
