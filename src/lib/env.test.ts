import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadEnv() {
  vi.resetModules();
  return import('./env');
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('API_URL', () => {
  it('quita la barra final', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.com/');

    expect((await loadEnv()).API_URL).toBe('https://api.example.com');
  });

  it('cae a localhost fuera de producción', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');

    expect((await loadEnv()).API_URL).toBe('http://localhost:8000');
  });

  it('rompe en producción si falta la URL', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');
    vi.stubEnv('NODE_ENV', 'production');

    await expect(loadEnv()).rejects.toThrow('NEXT_PUBLIC_API_URL');
  });
});
