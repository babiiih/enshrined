import { Skeleton } from "@/components/ui/skeleton";

export function DeploySkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="mt-6 flex gap-2 border-b border-border pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-md" />
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-border bg-card/60 p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-3 w-72 max-w-full" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    </div>
  );
}