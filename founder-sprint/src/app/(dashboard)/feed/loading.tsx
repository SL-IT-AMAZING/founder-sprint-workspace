import { Skeleton, SkeletonText, SkeletonButton } from "@/components/ui/Skeleton";

export default function FeedLoading() {
  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-6">
        <div
          className="p-4 rounded-lg"
          style={{ border: "1px solid var(--color-card-border)" }}
        >
          <Skeleton height={80} width="100%" />
          <div className="flex justify-end mt-3">
            <SkeletonButton />
          </div>
        </div>

        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-lg"
            style={{ border: "1px solid var(--color-card-border)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Skeleton circle width={40} height={40} />
              <div>
                <Skeleton height="1rem" width={140} className="mb-1" />
                <Skeleton height="0.75rem" width={80} />
              </div>
            </div>
            <SkeletonText lines={3} />
            <div className="flex gap-4 mt-4">
              <Skeleton height="1rem" width={60} />
              <Skeleton height="1rem" width={80} />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden lg:block w-64 shrink-0">
        <div
          className="p-4 rounded-lg"
          style={{ border: "1px solid var(--color-card-border)" }}
        >
          <Skeleton height="1.25rem" width={120} className="mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton circle width={28} height={28} />
                <Skeleton height="0.875rem" width={100} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
