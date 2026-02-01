type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: AvatarSize | number;
  badge?: string;
}

const sizeMap: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function getSizeValue(size: AvatarSize | number): number {
  return typeof size === "string" ? sizeMap[size] : size;
}

export function Avatar({ src, name, size = "md", badge }: AvatarProps) {
  const sizeValue = getSizeValue(size);

  const avatarElement = src ? (
    <img
      src={src}
      alt={name}
      className="rounded-full object-cover"
      style={{
        width: sizeValue,
        height: sizeValue,
        border: "1px solid rgba(0,0,0,0.1)",
        transition: "opacity 0.2s ease-in-out",
      }}
    />
  ) : (
    <div
      className="rounded-full flex items-center justify-center font-medium"
      style={{
        width: sizeValue,
        height: sizeValue,
        backgroundColor: "#e0e0e0",
        color: "var(--color-foreground)",
        fontSize: sizeValue * 0.35,
        border: "1px solid rgba(0,0,0,0.1)",
        transition: "opacity 0.2s ease-in-out",
      }}
    >
      {getInitials(name)}
    </div>
  );

  if (badge) {
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
        {avatarElement}
        <span
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            backgroundColor: "#555AB9",
            color: "white",
            fontSize: 9,
            fontWeight: 700,
            padding: "2px 4px",
            borderRadius: 3,
            lineHeight: 1,
          }}
        >
          {badge}
        </span>
      </div>
    );
  }

  return avatarElement;
}
