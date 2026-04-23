interface PostImageGridProps {
  images: Array<{ id?: string; imageUrl: string }>;
}

export function PostImageGrid({ images }: PostImageGridProps) {
  if (images.length === 0) return null;

  const isSingle = images.length === 1;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isSingle ? "1fr" : "repeat(2, minmax(0, 1fr))",
        gap: "10px",
        marginTop: "12px",
      }}
    >
      {images.map((image, index) => (
        <div
          key={image.id || image.imageUrl}
          style={{
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid #E8E1D4",
            backgroundColor: "#F6F2EA",
            aspectRatio: isSingle ? "16 / 10" : "1 / 1",
          }}
        >
          <img
            src={image.imageUrl}
            alt={`Post image ${index + 1}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>
      ))}
    </div>
  );
}
