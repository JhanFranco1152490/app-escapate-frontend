import { describe, expect, it } from 'vitest';

import { API_URL } from '@/lib/env';

import { googleLoginUrl } from './google-login-url';

const nextOf = (url: string) => new URL(url).searchParams.get('next');

describe('googleLoginUrl', () => {
  it('apunta al inicio del ingreso con Google en la API', () => {
    const url = new URL(googleLoginUrl('/'));

    expect(`${url.origin}${url.pathname}`).toBe(
      `${API_URL}/api/auth/google/start`,
    );
  });

  it('envía next codificado', () => {
    const url = googleLoginUrl('/cotizaciones/12?tab=pagos&orden=fecha');

    expect(url).toContain(
      'next=%2Fcotizaciones%2F12%3Ftab%3Dpagos%26orden%3Dfecha',
    );
    expect(nextOf(url)).toBe('/cotizaciones/12?tab=pagos&orden=fecha');
  });

  it('cambia un next externo por /', () => {
    expect(nextOf(googleLoginUrl('//evil.example'))).toBe('/');
  });
});
