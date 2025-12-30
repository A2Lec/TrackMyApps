import { Skeleton } from '@/components/ui/skeleton';

interface LoadingSkeletonProps {
  type?: 'grid' | 'list' | 'cards' | 'table';
  count?: number;
  className?: string;
}

export function LoadingSkeleton({ type = 'grid', count = 6, className }: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i + 1);

  if (type === 'grid') {
    return (
      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className || ''}`}>
        {items.map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (type === 'cards') {
    return (
      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className || ''}`}>
        {items.map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className={`space-y-3 ${className || ''}`}>
        {items.map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`space-y-2 ${className || ''}`}>
        <Skeleton className="h-10 w-full" />
        {items.map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return null;
}

interface PageLoadingSkeletonProps {
  hasHeader?: boolean;
  hasFilters?: boolean;
  contentType?: 'grid' | 'list' | 'cards' | 'table';
  itemCount?: number;
}

export function PageLoadingSkeleton({
  hasHeader = true,
  hasFilters = false,
  contentType = 'grid',
  itemCount = 6,
}: PageLoadingSkeletonProps) {
  return (
    <div className="space-y-6">
      {hasHeader && (
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
      )}
      
      {hasFilters && (
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
      )}
      
      <LoadingSkeleton type={contentType} count={itemCount} />
    </div>
  );
}
