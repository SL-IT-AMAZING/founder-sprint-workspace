import { Skeleton, SkeletonText, SkeletonButton } from "@/components/ui/Skeleton";

export default function QuestionsLoading() {
  return (
    <div className="container" style={{ maxWidth: 900 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton height="2rem" width={180} className="mb-2" />
          <Skeleton height="1rem" width={320} />
        </div>
        <SkeletonButton />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-lg"
            style={{ border: "1px solid var(--color-card-border)" }}
          >
            <div className="flex items-start gap-3">
              <Skeleton circle width={36} height={36} />
              <div className="flex-1">
                <Skeleton height="1.25rem" width="60%" className="mb-2" />
                <SkeletonText lines={2} />
                <div className="flex gap-4 mt-3">
                  <Skeleton height="0.875rem" width={80} />
                  <Skeleton height="0.875rem" width={60} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
