import { Skeleton } from '@/components/ui/skeleton';

export function PanelSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando el panel"
      className="flex flex-1 flex-col"
    >
      <div className="flex h-16 items-center justify-between border-b px-4 md:h-18 md:px-9">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="size-9 rounded-full" />
      </div>
      <div className="flex flex-col gap-4 px-4 py-8 md:px-9">
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
    </div>
  );
}
