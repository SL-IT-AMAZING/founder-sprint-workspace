import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

export default function GroupsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton height="2rem" width={120} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-lg"
            style={{ border: "1px solid var(--color-card-border)" }}
          >
            <Skeleton height="1.25rem" width="60%" className="mb-3" />
            <SkeletonText lines={2} />
            <div className="flex items-center gap-2 mt-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} circle width={28} height={28} />
              ))}
              <Skeleton height="0.875rem" width={60} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
