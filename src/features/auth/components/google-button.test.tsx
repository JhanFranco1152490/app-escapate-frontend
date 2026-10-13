import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { googleLoginUrl } from '../google-login-url';
import { GoogleButton } from './google-button';

describe('GoogleButton', () => {
  it('es un enlace a google/start con el next recibido', () => {
    render(<GoogleButton next="/cotizaciones/12" />);

    expect(
      screen.getByRole('link', { name: 'Continuar con Google' }),
    ).toHaveAttribute('href', googleLoginUrl('/cotizaciones/12'));
  });

  it('sin next vuelve a la página principal', () => {
    render(<GoogleButton next={null} />);

    const href = screen
      .getByRole('link', { name: 'Continuar con Google' })
      .getAttribute('href');
    expect(new URL(href!).searchParams.get('next')).toBe('/');
  });
});
