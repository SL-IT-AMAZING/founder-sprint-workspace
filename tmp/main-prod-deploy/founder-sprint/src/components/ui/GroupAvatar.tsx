const AVATAR_COLORS = [
  "#E54D42",
  "#D94E8F",
  "#8B5CF6",
  "#6366F1",
  "#3B82F6",
  "#0891B2",
  "#0D9488",
  "#16A34A",
  "#CA8A04",
  "#EA580C",
] as const;

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getColorForName(name: string): string {
  return AVATAR_COLORS[hashString(name) % AVATAR_COLORS.length];
}

function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}

interface GroupAvatarProps {
  name: string;
  image?: string | null;
  emoji?: string | null;
  size?: number;
  style?: React.CSSProperties;
}

export function GroupAvatar({ name, image, emoji, size = 36, style }: GroupAvatarProps) {
  const bgColor = getColorForName(name);
  const fontSize = Math.round(size * 0.42);
  const borderRadius = "10px";

  if (image) {
    return (
      <img
        src={image}
        alt={name}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius,
          objectFit: "cover",
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius,
        backgroundColor: bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${fontSize}px`,
        fontWeight: 600,
        color: "#FFFFFF",
        flexShrink: 0,
        letterSpacing: "-0.02em",
        userSelect: "none",
        ...style,
      }}
      aria-hidden
    >
      {emoji || getInitial(name)}
    </div>
  );
}
