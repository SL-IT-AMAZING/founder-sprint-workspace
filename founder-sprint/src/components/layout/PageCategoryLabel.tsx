export function PageCategoryLabel({ label }: { label: string }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color: "#999999",
        margin: "0 0 4px 0",
      }}
    >
      {label}
    </p>
  );
}
