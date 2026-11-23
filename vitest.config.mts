import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // Zona fija distinta de America/Bogota: los tests de fechas tienen que fallar si el código
    // usa la zona de la máquina en vez de la del negocio.
    env: { TZ: 'UTC' },
    globals: true,
    // Debe ser mayor que la espera de Testing Library (vitest.setup.ts), o el test se corta antes
    // de que esa espera termine y muestre qué faltaba.
    testTimeout: 15_000,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/lib/api/schema.d.ts',
        'src/components/ui/**',
        'src/app/**',
      ],
    },
  },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
});
