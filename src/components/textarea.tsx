import { cn } from 'cn';
import type { ComponentProps } from 'react';

// Mismo aspecto que `Input`, para textos de varias palabras como notas u observaciones.
export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        // Letra de 16 px en todos los anchos: con menos, iOS hace zoom al enfocar el campo.
        'min-h-24 w-full min-w-0 rounded-lg border border-input bg-field px-3.5 py-2.5 text-base text-foreground transition-colors placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  );
}
