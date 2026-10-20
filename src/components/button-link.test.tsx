import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ButtonLink } from './button-link';

describe('ButtonLink', () => {
  it('la variante outline conserva su borde visible', () => {
    render(
      <ButtonLink href="/usuarios" variant="outline">
        Editar
      </ButtonLink>,
    );

    const link = screen.getByRole('link', { name: 'Editar' });
    expect(link).toHaveAttribute('href', '/usuarios');
    // La base del botón trae un borde transparente; sin combinar las clases, ese borde
    // le ganaba al de la variante y el enlace se veía sin marco.
    expect(link).toHaveClass('border-border');
    expect(link).not.toHaveClass('border-transparent');
  });
});
