import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

export default function EventsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton height="2rem" width={120} />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-lg"
            style={{ border: "1px solid var(--color-card-border)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <Skeleton height="1.25rem" width="45%" />
              <Skeleton height="1.5rem" width={90} style={{ borderRadius: "9999px" }} />
            </div>
            <SkeletonText lines={2} />
            <div className="flex gap-4 mt-3">
              <Skeleton height="0.875rem" width={140} />
              <Skeleton height="0.875rem" width={100} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
