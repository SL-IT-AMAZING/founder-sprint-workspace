import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

export default function OfficeHoursLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton height="2rem" width={170} />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-lg"
            style={{ border: "1px solid var(--color-card-border)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Skeleton circle width={36} height={36} />
              <div>
                <Skeleton height="1rem" width={120} className="mb-1" />
                <Skeleton height="0.75rem" width={80} />
              </div>
            </div>
            <SkeletonText lines={1} />
            <div className="flex gap-4 mt-3">
              <Skeleton height="0.875rem" width={130} />
              <Skeleton height="0.875rem" width={90} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
