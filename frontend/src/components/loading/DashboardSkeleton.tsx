import { Skeleton } from '@/components/ui/skeleton';

// Kept outside pages/Dashboard so the route fallback can show it without importing the page chunk
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full min-w-0" aria-busy="true" aria-label="Chargement du tableau de bord">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/40">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="h-28 w-full rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 h-full">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-full rounded-lg" />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Skeleton className="h-80 rounded-xl lg:col-span-5" />
        <Skeleton className="h-80 rounded-xl lg:col-span-7" />
      </div>
    </div>
  );
}
