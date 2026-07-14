import { Skeleton } from "@turbo/ui/skeleton";

export const LoadingState = () => (
  <div data-slot="sifter-loading-state" className="mt-5 space-y-5">
    <div className="space-y-2">
      <Skeleton className="h-4 w-44 rounded-full" />
      <Skeleton className="h-4 w-full rounded-full" />
      <Skeleton className="h-4 w-4/5 rounded-full" />
    </div>
    <div className="flex flex-wrap gap-2">
      <Skeleton className="h-9 w-32 rounded-full" />
      <Skeleton className="h-9 w-40 rounded-full" />
      <Skeleton className="h-9 w-28 rounded-full" />
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <Skeleton className="h-12 w-full rounded-2xl" />
      <Skeleton className="h-12 w-full rounded-2xl" />
    </div>
  </div>
);
