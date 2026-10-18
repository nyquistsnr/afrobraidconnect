import { PageLoading, Skeleton } from "@/components/ui/skeleton";

export default function EstherAiLoading() {
  return (
    <PageLoading label="Loading">
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center px-4 py-10 sm:px-6 lg:px-10">
        <Skeleton className="h-10 w-64 sm:h-12 sm:w-96" />
        <Skeleton className="mt-4 h-5 w-full max-w-xl" />
        <Skeleton className="mt-2 h-5 w-2/3 max-w-md" />
        <div className="mt-10 grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-12 w-40 rounded-xl" />
          </div>
        </div>
      </main>
    </PageLoading>
  );
}
