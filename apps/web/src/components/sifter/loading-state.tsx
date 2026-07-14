import { Skeleton } from "@turbo/ui/skeleton";

export const LoadingState = () => (
  <div data-slot="sifter-loading-state" className="space-y-5">
    <div className="space-y-2">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
    <div className="flex flex-wrap gap-2">
      <Skeleton className="h-8 w-28 rounded-full" />
      <Skeleton className="h-8 w-36 rounded-full" />
      <Skeleton className="h-8 w-24 rounded-full" />
    </div>
    <div className="grid gap-2 sm:grid-cols-2">
      <Skeleton className="h-10 w-full rounded-md" />
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  </div>
);
