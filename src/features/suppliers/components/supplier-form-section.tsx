import type { ReactNode } from 'react';

// Un bloque del formulario de proveedores: título arriba y sus campos en dos columnas desde md.
// `required` agrega la leyenda de campos obligatorios en el primer bloque.
export function SupplierFormSection({
  title,
  required,
  children,
}: {
  title: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border bg-card">
      <header className="flex items-center justify-between gap-3 border-b px-5 py-4">
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        {required && (
          <span className="font-mono text-[0.625rem] tracking-[0.16em] text-muted-foreground uppercase">
            * Obligatorio
          </span>
        )}
      </header>
      <div className="grid gap-5 px-5 py-5 md:grid-cols-2">{children}</div>
    </section>
  );
}
