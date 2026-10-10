import { screen } from '@testing-library/react';
import type { UrlUpdateEvent } from 'nuqs/adapters/testing';
import { describe, expect, it, vi } from 'vitest';

import { renderWithProviders } from '@/test/render';

import { googleLoginUrl } from '../google-login-url';
import { LoginScreen } from './login-screen';

describe('LoginScreen', () => {
  it('muestra el título y el botón de Google con el next de la URL', () => {
    renderWithProviders(<LoginScreen />, {
      searchParams: '?next=/clientes',
    });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Iniciar sesión' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Continuar con Google' }),
    ).toHaveAttribute('href', googleLoginUrl('/clientes'));
  });

  it('muestra el aviso del error de la URL y lo quita de la URL', async () => {
    const onUrlUpdate = vi.fn<(event: UrlUpdateEvent) => void>();
    renderWithProviders(<LoginScreen />, {
      searchParams: '?error=google_cancelled&next=/clientes',
      onUrlUpdate,
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Cancelaste el inicio de sesión con Google.',
    );
    await vi.waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());
    const { searchParams } = onUrlUpdate.mock.lastCall![0];
    expect(searchParams.has('error')).toBe(false);
    expect(searchParams.get('next')).toBe('/clientes');
    // El aviso sigue a la vista aunque el parámetro ya no esté.
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('no muestra nada con un error desconocido', () => {
    renderWithProviders(<LoginScreen />, {
      searchParams: '?error=<b>texto</b>',
    });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
