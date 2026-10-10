import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Alert } from './alert';

describe('Alert', () => {
  it('se anuncia como alerta con su título y su texto', () => {
    render(
      <Alert title="Tu cuenta está inactiva.">
        Escribe a un administrador de la agencia.
      </Alert>,
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Tu cuenta está inactiva.');
    expect(alert).toHaveTextContent(
      'Escribe a un administrador de la agencia.',
    );
  });

  it('funciona sin título', () => {
    render(<Alert variant="info">Cancelaste el inicio de sesión.</Alert>);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Cancelaste el inicio de sesión.',
    );
  });
});
