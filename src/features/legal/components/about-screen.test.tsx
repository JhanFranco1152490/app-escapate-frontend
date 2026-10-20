import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AboutScreen } from './about-screen';

describe('AboutScreen', () => {
  it('presenta la plataforma y enlaza al login y a las dos políticas', () => {
    render(<AboutScreen />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Escápate' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Iniciar sesión' }),
    ).toHaveAttribute('href', '/iniciar-sesion');
    expect(
      screen.getByRole('link', { name: 'política de privacidad' }),
    ).toHaveAttribute('href', '/privacidad');
    expect(
      screen.getByRole('link', { name: 'términos y condiciones' }),
    ).toHaveAttribute('href', '/terminos');
  });
});
