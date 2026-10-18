import type { VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import Link from 'next/link';
import type { ComponentProps } from 'react';

import { buttonVariants } from '@/components/ui/button';

type ButtonLinkProps = ComponentProps<typeof Link> &
  VariantProps<typeof buttonVariants>;

// Enlace con la apariencia de un botón. Las clases pasan por `cn`, igual que en `Button`:
// así un choque entre la base y la variante (por ejemplo, el borde transparente de la base y
// el visible de `outline`) se resuelve a favor de la variante.
export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
