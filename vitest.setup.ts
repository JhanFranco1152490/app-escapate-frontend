import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from '@/test/server';

// El segundo que espera Testing Library por omisión se queda corto en una máquina cargada (el CI,
// o con el servidor de desarrollo encendido) y el test falla sin que nada esté mal. Esta espera
// solo se gasta cuando algo no aparece: un test que pasa no tarda más.
configure({ asyncUtilTimeout: 5000 });

// Una petición sin handler es un error: ningún test debe tocar la red real.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
