import { ShieldCheck } from 'lucide-react';

// Lo que se ve a la derecha de la lista, en escritorio, mientras no hay un rol abierto. En
// celular no hace falta: la lista ocupa la pantalla.
export function RolePlaceholder() {
  return (
    <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-md border border-dashed p-8 text-center text-[0.84375rem] text-muted-foreground max-lg:hidden">
      <ShieldCheck aria-hidden="true" className="size-6 text-orange-500" />
      <p>Elige un rol para ver sus permisos.</p>
    </div>
  );
}
