import { Skeleton } from '@/components/ui/skeleton';

// Filas de espera de una tabla del panel mientras llega la primera página.
export function TableSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col">
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 border-t px-4 py-4 first:border-t-0"
        >
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
          <Skeleton className="h-3.5 w-24 max-md:hidden" />
          <Skeleton className="h-3.5 w-20 max-md:hidden" />
        </div>
      ))}
    </div>
  );
}
