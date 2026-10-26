'use client';

import { Search } from 'lucide-react';
import { useEffect, useEffectEvent, useState } from 'react';

import { Input } from '@/components/ui/input';

const DEBOUNCE_MS = 300;

type SearchInputProps = {
  // Para asociarlo a una etiqueta visible; sin ella basta `label`.
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  placeholder?: string;
  maxLength?: number;
};

// Muestra lo escrito al instante y avisa del cambio solo cuando la persona deja de escribir,
// para no pedir una lista nueva por cada tecla.
export function SearchInput({
  id,
  value,
  onValueChange,
  label,
  placeholder,
  maxLength,
}: SearchInputProps) {
  const [draft, setDraft] = useState(value);
  // `value` llega tarde: primero se avisa del cambio y la URL se actualiza después. Por eso
  // se recuerda lo último enviado: si `value` cambia a eso, es el propio cambio y el borrador
  // no se toca (la persona pudo seguir escribiendo); si cambia a otra cosa, vino de afuera
  // (por ejemplo, "Limpiar filtros") y el borrador se reemplaza.
  const [seen, setSeen] = useState(value);
  const [lastSent, setLastSent] = useState(value);
  if (value !== seen) {
    setSeen(value);
    if (value !== lastSent) setDraft(value);
  }

  // Fuera de las dependencias del efecto: si quien usa el campo pasa una función nueva en
  // cada render, la espera no vuelve a empezar.
  const notify = useEffectEvent((next: string) => {
    setLastSent(next);
    onValueChange(next);
  });

  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => notify(draft), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, value]);

  return (
    <div className="relative min-w-0 flex-1">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        id={id}
        type="search"
        aria-label={label}
        placeholder={placeholder}
        maxLength={maxLength}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="h-11 pl-10"
      />
    </div>
  );
}
