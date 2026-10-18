import { PageLoading, Skeleton } from "@/components/ui/skeleton";

// Mirrors BraiderDetailView's layout (identity row, about, gallery, sticky
// booking card) so the profile appears to fill in rather than jump.
export default function BraiderDetailLoading() {
  return (
    <PageLoading label="Loading">
      <div className="mx-auto w-full max-w-[1760px] px-4 pt-4 sm:px-6 lg:px-10">
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      <div className="mx-auto grid w-full max-w-[1760px] grid-cols-1 gap-10 px-4 pt-8 pb-16 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-10">
        <div className="flex flex-col gap-8">
          <div className="flex items-start gap-4">
            <Skeleton className="size-14 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2 pt-1">
              <Skeleton className="h-7 w-3/5 max-w-sm" />
              <Skeleton className="h-4 w-2/5 max-w-[200px]" />
            </div>
          </div>
          <Skeleton className="h-16 w-full rounded-2xl" />
          <div className="flex flex-col gap-3 border-t border-border pt-8">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-border pt-8 sm:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="sticky top-28 flex flex-col gap-4 rounded-3xl border border-border p-6">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
      {/* Mobile sticky booking bar placeholder. */}
      <div className="fixed inset-x-0 bottom-0 flex items-center justify-between border-t border-border bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-11 w-32 rounded-xl" />
      </div>
    </PageLoading>
  );
}
