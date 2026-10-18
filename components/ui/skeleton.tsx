// Shared shimmer placeholders for route-level loading.tsx screens, so a page
// that waits on the API shows its shape instantly instead of freezing.
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-lg bg-border/50 ${className}`} aria-hidden />;
}

// Stand-in for SiteHeader, which each page renders itself (so it isn't
// part of any layout that stays mounted while the page loads).
export function HeaderSkeleton() {
  return (
    <div className="border-b border-border/60 bg-surface">
      <div className="mx-auto flex h-16 max-w-[1760px] items-center justify-between gap-4 px-4 sm:px-6 md:h-24 lg:px-10">
        <Skeleton className="h-8 w-28 sm:h-10 sm:w-36" />
        <Skeleton className="hidden h-14 w-full max-w-[560px] rounded-full md:block" />
        <Skeleton className="h-10 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function PageLoading({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-live="polite" aria-label={label} className="flex min-h-dvh flex-col bg-background">
      <HeaderSkeleton />
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}
