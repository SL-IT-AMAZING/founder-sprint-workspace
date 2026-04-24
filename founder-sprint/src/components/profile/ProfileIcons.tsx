import type { CSSProperties } from "react";

type IconProps = {
  size?: number;
  style?: CSSProperties;
};

const iconBaseStyle = (size: number, style?: CSSProperties): CSSProperties => ({
  width: size,
  height: size,
  display: "inline-block",
  flexShrink: 0,
  ...style,
});

export function LinkedInIcon({ size = 18, style }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 18 18"
      style={iconBaseStyle(size, style)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.6676 0H1.32891C0.594141 0 0 0.580078 0 1.29727V16.6992C0 17.4164 0.594141 18 1.32891 18H16.6676C17.4023 18 18 17.4164 18 16.7027V1.29727C18 0.580078 17.4023 0 16.6676 0ZM5.34023 15.3387H2.66836V6.74648H5.34023V15.3387ZM4.0043 5.57578C3.14648 5.57578 2.45391 4.8832 2.45391 4.02891C2.45391 3.17461 3.14648 2.48203 4.0043 2.48203C4.85859 2.48203 5.55117 3.17461 5.55117 4.02891C5.55117 4.87969 4.85859 5.57578 4.0043 5.57578ZM15.3387 15.3387H12.6703V11.1621C12.6703 10.1672 12.6527 8.88398 11.2816 8.88398C9.89297 8.88398 9.68203 9.97031 9.68203 11.0918V15.3387H7.01719V6.74648H9.57656V7.9207H9.61172C9.9668 7.2457 10.8387 6.53203 12.1359 6.53203C14.8395 6.53203 15.3387 8.31094 15.3387 10.6242V15.3387Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function XIcon({ size = 18, style }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 18 18"
      style={iconBaseStyle(size, style)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.1757 0.864807H16.9357L10.9058 7.75732L18 17.1346H12.4455L8.0955 11.4466L3.117 17.1346H0.3555L6.8055 9.76207L0 0.865557H5.6955L9.62775 6.06456L14.1757 0.864807ZM13.2075 15.4831H14.7368L4.8645 2.43006H3.2235L13.2075 15.4831Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function WebsiteIcon({ size = 18, style }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      style={iconBaseStyle(size, style)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M3.5 12H20.5M12 3C14.1 5.45 15.1667 8.45 15.2 12C15.1667 15.55 14.1 18.55 12 21M12 3C9.9 5.45 8.83333 8.45 8.8 12C8.83333 15.55 9.9 18.55 12 21"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function getInstitutionInitials(institution: string): string {
  const stopWords = new Set(["and", "of", "the", "for", "at"]);
  const words = institution
    .replace(/&/g, " and ")
    .split(/\s+/)
    .map((word) => word.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean);

  const acronymWords = words.filter((word, index) => {
    const lower = word.toLowerCase();
    return index === 0 || !stopWords.has(lower);
  });

  const initials = acronymWords
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return initials || "ED";
}

type EducationLogoFallbackProps = {
  institution: string;
  size?: number;
};

export function EducationLogoFallback({ institution, size = 48 }: EducationLogoFallbackProps) {
  return (
    <span
      aria-hidden="true"
      title={`${institution} logo placeholder`}
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: "linear-gradient(135deg, #F7F4EF 0%, #ECE6DC 100%)",
        border: "1px solid #E2DDD5",
        color: "#2F2C26",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: size >= 48 ? 15 : 13,
        fontWeight: 700,
        letterSpacing: "0.02em",
        lineHeight: 1,
      }}
    >
      {getInstitutionInitials(institution)}
    </span>
  );
}
