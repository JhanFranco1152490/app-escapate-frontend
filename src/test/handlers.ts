import { http, HttpResponse } from 'msw';

import { API_URL } from '@/lib/env';

export const TEST_CSRF_TOKEN = 'test-csrf';

export const apiUrl = (path: string) => `${API_URL}${path}`;

export const csrfHandler = http.get(apiUrl('/api/auth/csrf'), () =>
  HttpResponse.json({ csrf_token: TEST_CSRF_TOKEN }),
);

export const defaultHandlers = [csrfHandler];
