"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface AnimatedButtonProps {
  children: React.ReactNode;
  variant?: "dark" | "light" | "linkedin";
  size?: "default" | "small";
  to?: string;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
}

const variantStyles = {
  dark: {
    backgroundColor: "#2F2C26",
    color: "#ffffff",
  },
  light: {
    backgroundColor: "rgba(47,44,38,0.1)",
    color: "#2F2C26",
  },
  linkedin: {
    backgroundColor: "#0077B5",
    color: "#ffffff",
  },
};

const sizeStyles = {
  default: {
    height: 56,
    padding: "0 24px",
  },
  small: {
    height: 42,
    padding: "0 18px",
  },
};

export function AnimatedButton({
  children,
  variant = "dark",
  size = "default",
  to,
  href,
  onClick,
  type = "button",
  className = "",
  disabled = false,
}: AnimatedButtonProps) {
  const baseStyles: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    fontWeight: 500,
    fontSize: 16,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none",
    textDecoration: "none",
    opacity: disabled ? 0.6 : 1,
    width: "100%",
    gap: 12,
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  const content = (
    <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {children}
    </span>
  );

  if (to) {
    return (
      <motion.div
        style={{ display: "inline-block", width: "100%" }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
      >
        <Link href={to} style={baseStyles} className={className}>
          {content}
        </Link>
      </motion.div>
    );
  }

  if (href) {
    return (
      <motion.div
        style={{ display: "inline-block", width: "100%" }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
      >
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={baseStyles}
          className={className}
        >
          {content}
        </a>
      </motion.div>
    );
  }

  return (
    <motion.div
      style={{ display: "inline-block", width: "100%" }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        style={baseStyles}
        className={className}
      >
        {content}
      </button>
    </motion.div>
  );
}
