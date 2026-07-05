import { Skeleton } from "@/components/ui/skeleton";

export function PoolsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-4">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 border-b border-border">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <span />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 border-b border-border/60 last:border-b-0 items-center"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="size-7 -ml-2 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-7 w-12 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}