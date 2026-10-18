import { PageLoading, Skeleton } from "@/components/ui/skeleton";

// Checkout shape: steps on the left, order summary on the right.
export default function BookingCheckoutLoading() {
  return (
    <PageLoading label="Loading">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-10">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-8 w-56" />
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-2xl border border-border p-5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-4 rounded-3xl border border-border p-6 lg:self-start">
          <div className="flex items-center gap-3">
            <Skeleton className="size-16 rounded-xl" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </PageLoading>
  );
}
