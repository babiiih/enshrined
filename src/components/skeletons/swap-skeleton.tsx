import { Skeleton } from "@/components/ui/skeleton";

export function SwapSkeleton() {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      <div className="rounded-2xl border border-border bg-card/60 p-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-6 rounded-md" />
        </div>
        <div className="mt-5 rounded-xl border border-border bg-background/40 p-4">
          <Skeleton className="h-3 w-12" />
          <div className="mt-3 flex items-center justify-between gap-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-3 w-16" />
        </div>
        <div className="my-2 flex justify-center">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="rounded-xl border border-border bg-background/40 p-4">
          <Skeleton className="h-3 w-12" />
          <div className="mt-3 flex items-center justify-between gap-3">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-3 w-16" />
        </div>
        <Skeleton className="mt-5 h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}