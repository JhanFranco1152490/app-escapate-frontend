import { renderHook, waitFor } from '@testing-library/react';
import { StrictMode, type ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { readTokenFromHash, useResetTokenFromHash } from './reset-token';

describe('readTokenFromHash', () => {
  it('lee el token del fragmento', () => {
    expect(readTokenFromHash('#token=abc.def-ghi')).toBe('abc.def-ghi');
  });

  it('sin token o vacío devuelve null', () => {
    expect(readTokenFromHash('')).toBeNull();
    expect(readTokenFromHash('#')).toBeNull();
    expect(readTokenFromHash('#token=')).toBeNull();
    expect(readTokenFromHash('#otra=cosa')).toBeNull();
  });
});

describe('useResetTokenFromHash', () => {
  afterEach(() => window.history.replaceState(null, '', '/'));

  it('devuelve el token y lo quita de la URL, conservando la ruta', async () => {
    window.history.replaceState(
      null,
      '',
      '/restablecer-contrasena#token=abc.def',
    );

    const { result } = renderHook(() => useResetTokenFromHash());

    await waitFor(() => expect(result.current).toBe('abc.def'));
    expect(window.location.pathname).toBe('/restablecer-contrasena');
    expect(window.location.hash).toBe('');
  });

  it('sin fragmento devuelve null', async () => {
    window.history.replaceState(null, '', '/restablecer-contrasena');

    const { result } = renderHook(() => useResetTokenFromHash());

    await waitFor(() => expect(result.current).toBeNull());
  });

  it('en StrictMode no pierde el token por el doble efecto', async () => {
    window.history.replaceState(null, '', '/crear-contrasena#token=abc.def');
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StrictMode>{children}</StrictMode>
    );

    const { result } = renderHook(() => useResetTokenFromHash(), { wrapper });

    await waitFor(() => expect(result.current).toBe('abc.def'));
    expect(window.location.hash).toBe('');
  });
});
