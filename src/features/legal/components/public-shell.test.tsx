import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PublicShell } from './public-shell';

describe('PublicShell', () => {
  it('muestra el contenido con acceso al login y a las políticas en el pie', () => {
    render(
      <PublicShell>
        <p>Contenido de la página</p>
      </PublicShell>,
    );

    expect(screen.getByText('Contenido de la página')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Iniciar sesión' }),
    ).toHaveAttribute('href', '/iniciar-sesion');
    expect(
      screen.getByRole('link', { name: 'Política de privacidad' }),
    ).toHaveAttribute('href', '/privacidad');
    expect(
      screen.getByRole('link', { name: 'Términos y condiciones' }),
    ).toHaveAttribute('href', '/terminos');
  });
});
