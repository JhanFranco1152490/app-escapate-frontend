import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

type PaginationProps = {
  page: number;
  pageSize: number;
  count: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPageChange: (page: number) => void;
};

export function Pagination({
  page,
  pageSize,
  count,
  hasPrevious,
  hasNext,
  onPageChange,
}: PaginationProps) {
  const first = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, count);

  return (
    <nav
      aria-label="Paginación"
      className="flex items-center justify-between gap-3 border-t px-4 py-2.5"
    >
      <p className="font-mono text-[0.6875rem] text-muted-foreground">
        {first}–{last} de {count}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={!hasPrevious}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft aria-hidden="true" />
          Anterior
        </Button>
        <Button
          variant="outline"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
