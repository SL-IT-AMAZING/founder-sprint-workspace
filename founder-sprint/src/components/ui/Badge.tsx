type BadgeVariant = "default" | "outline" | "success" | "warning" | "error" | "role";
type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: {
    backgroundColor: "#555AB9",
    color: "white",
  },
  outline: {
    backgroundColor: "transparent",
    border: "1px solid #555AB9",
    color: "#555AB9",
  },
  success: {
    backgroundColor: "#E8F5E9",
    color: "var(--color-success)",
  },
  warning: {
    backgroundColor: "#FFF3E0",
    color: "var(--color-warning)",
  },
  error: {
    backgroundColor: "#FFEBEE",
    color: "var(--color-error)",
  },
  role: {
    backgroundColor: "#555AB9",
    color: "white",
  },
};

const sizeStyles: Record<BadgeSize, React.CSSProperties> = {
  sm: {
    fontSize: 9,
    padding: "2px 4px",
  },
  md: {
    fontSize: 11,
    padding: "3px 6px",
  },
  lg: {
    fontSize: 13,
    padding: "4px 8px",
  },
};

export function Badge({ children, variant = "default", size = "md" }: BadgeProps) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        borderRadius: 3,
        display: "inline-block",
        ...variantStyles[variant],
        ...sizeStyles[size],
      }}
    >
      {children}
    </span>
  );
}
