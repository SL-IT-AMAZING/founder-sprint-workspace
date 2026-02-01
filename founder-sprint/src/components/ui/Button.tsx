"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "linkedin";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  danger: "btn",
  ghost: "btn",
  linkedin: "btn btn-linkedin",
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { height: 42, fontSize: 13, padding: "0 18px" },
  md: { height: 48, fontSize: 14, padding: "0 24px" },
  lg: { height: 56, fontSize: 16, padding: "0 32px" },
};

const variantInlineStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: "#555AB9",
    color: "white",
    borderRadius: 9,
    transition: "background-color 0.2s ease",
  },
  secondary: {
    borderRadius: 9,
  },
  danger: {
    backgroundColor: "var(--color-error)",
    color: "#fff",
    borderRadius: 9,
  },
  ghost: {
    background: "none",
    color: "var(--color-foreground-secondary)",
    borderRadius: 9,
  },
  linkedin: {
    borderRadius: 9,
  },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, children, style, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${variantStyles[variant]} ${className || ""}`}
        style={{ ...sizeStyles[size], ...variantInlineStyles[variant], opacity: disabled || loading ? 0.5 : 1, ...style }}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
