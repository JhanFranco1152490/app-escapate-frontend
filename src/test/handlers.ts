import { http, HttpResponse } from 'msw';

import { API_URL } from '@/lib/env';

import { buildSession } from './session';

export const TEST_CSRF_TOKEN = 'test-csrf';

export const apiUrl = (path: string) => `${API_URL}${path}`;

export const csrfHandler = http.get(apiUrl('/api/auth/csrf'), () =>
  HttpResponse.json({ csrf_token: TEST_CSRF_TOKEN }),
);

export const sessionHandler = (session = buildSession()) =>
  http.get(apiUrl('/api/auth/me'), () => HttpResponse.json(session));

const notAuthenticated = () =>
  HttpResponse.json(
    { detail: 'No autenticado.', code: 'not_authenticated', fields: {} },
    { status: 401 },
  );

// El cliente intenta renovar ante el 401 de /me, así que sin sesión también falla la
// renovación.
export const noSessionHandlers = [
  http.get(apiUrl('/api/auth/me'), notAuthenticated),
  http.post(apiUrl('/api/auth/refresh'), notAuthenticated),
];

export const defaultHandlers = [csrfHandler];
