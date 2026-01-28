'use client';

import Link from 'next/link';

type ButtonVariant = 'dark' | 'light' | 'light-2' | 'outline';
type ButtonSize = 'default' | 'small';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
}

interface ButtonLinkProps extends ButtonProps {
  href: string;
}

interface ButtonActionProps extends ButtonProps {
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  pending?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  dark: 'bg-[#000] text-[#fefaf3] hover:bg-[#333]',
  light: 'bg-[#fefaf34d] text-[#fefaf3] hover:bg-[#fefaf3] hover:text-[#000]',
  'light-2': 'bg-[#f1eadd] text-[#000] hover:bg-[#e5ddd0]',
  outline: 'bg-transparent border border-[#2f2c251f] text-[#000] hover:bg-[#2f2c250f]',
};

const sizeStyles: Record<ButtonSize, string> = {
  default: 'h-12 px-6',
  small: 'h-[42px] px-[18px]',
};

const baseStyles = `
  inline-flex items-center justify-center gap-2
  rounded-[9px] font-medium text-sm
  transition-all duration-200 ease-out
  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#000]
  disabled:opacity-50 disabled:cursor-not-allowed
`;

function AnimatedText({ children }: { children: React.ReactNode }) {
  return (
    <span className="overflow-hidden h-[1.4em]">
      <span className="flex flex-col transition-transform duration-300 group-hover:-translate-y-1/2">
        <span className="h-[1.4em] flex items-center justify-center">{children}</span>
        <span className="h-[1.4em] flex items-center justify-center">{children}</span>
      </span>
    </span>
  );
}

export function ButtonLink({
  href,
  children,
  variant = 'dark',
  size = 'default',
  className = '',
}: ButtonLinkProps) {
  const isExternal = href.startsWith('http') || href.startsWith('//');
  const combinedClassName = `group ${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={combinedClassName}
      >
        <AnimatedText>{children}</AnimatedText>
      </a>
    );
  }

  return (
    <Link href={href} className={combinedClassName}>
      <AnimatedText>{children}</AnimatedText>
    </Link>
  );
}

export function Button({
  children,
  variant = 'dark',
  size = 'default',
  type = 'button',
  onClick,
  disabled,
  pending,
  className = '',
}: ButtonActionProps) {
  const combinedClassName = `group ${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || pending}
      className={combinedClassName}
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        <AnimatedText>{children}</AnimatedText>
      )}
    </button>
  );
}

export function SubmitButton({
  children,
  variant = 'dark',
  size = 'default',
  pending,
  className = '',
}: Omit<ButtonActionProps, 'type' | 'onClick'>) {
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      pending={pending}
      disabled={pending}
      className={className}
    >
      {children}
    </Button>
  );
}

export function IconButton({
  children,
  variant = 'outline',
  size = 'small',
  onClick,
  disabled,
  className = '',
  'aria-label': ariaLabel,
}: ButtonActionProps & { 'aria-label': string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${size === 'small' ? 'h-[42px] w-[42px]' : 'h-12 w-12'}
        p-0
        ${className}
      `}
    >
      {children}
    </button>
  );
}

export default Button;
