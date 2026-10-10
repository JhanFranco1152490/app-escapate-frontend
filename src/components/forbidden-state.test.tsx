import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ForbiddenState } from './forbidden-state';

describe('ForbiddenState', () => {
  it('muestra un título y una explicación por defecto', () => {
    render(<ForbiddenState />);

    expect(
      screen.getByRole('heading', { name: 'No tienes acceso a esta sección' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Pídele a un administrador de la agencia/),
    ).toBeInTheDocument();
  });

  it('acepta título, explicación y acción propios', () => {
    render(
      <ForbiddenState
        title="Esta sección es solo para administradores"
        action={<button type="button">Volver al inicio</button>}
      >
        Tu cuenta está registrada como asesor.
      </ForbiddenState>,
    );

    expect(
      screen.getByRole('heading', {
        name: 'Esta sección es solo para administradores',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Tu cuenta está registrada como asesor.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Volver al inicio' }),
    ).toBeInTheDocument();
  });
});
