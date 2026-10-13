import { http, HttpResponse, delay } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/test/server';
import { TEST_CSRF_TOKEN, apiUrl } from '@/test/handlers';

import { apiFetch } from './client';
import { ApiError, UNEXPECTED_RESPONSE_CODE, isNetworkFailure } from './errors';

const errorBody = (code: string, fields: Record<string, string[]> = {}) => ({
  detail: 'Mensaje del API',
  code,
  fields,
});

function countRequests(
  method: 'get' | 'post',
  path: string,
  respond: () => Response,
) {
  const calls: Request[] = [];
  server.use(
    http[method](apiUrl(path), ({ request }) => {
      calls.push(request);
      return respond();
    }),
  );
  return calls;
}

async function captureError(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('La promesa no falló');
}

describe('apiFetch: CSRF', () => {
  it('no pide token ni envía la cabecera en un GET', async () => {
    const csrf = countRequests('get', '/api/auth/csrf', () =>
      HttpResponse.json({ csrf_token: TEST_CSRF_TOKEN }),
    );
    const calls = countRequests('get', '/api/things', () =>
      HttpResponse.json([]),
    );

    await apiFetch('/api/things');

    expect(csrf).toHaveLength(0);
    expect(calls[0].headers.get('X-CSRF-Token')).toBeNull();
  });

  it('pide el token y lo envía en una mutación', async () => {
    const calls = countRequests('post', '/api/things', () =>
      HttpResponse.json({ id: 1 }, { status: 201 }),
    );

    await apiFetch('/api/things', { method: 'POST', body: { name: 'a' } });

    expect(calls[0].headers.get('X-CSRF-Token')).toBe(TEST_CSRF_TOKEN);
    expect(calls[0].headers.get('Content-Type')).toBe('application/json');
    expect(await calls[0].json()).toEqual({ name: 'a' });
  });

  it('pide el token una sola vez para dos mutaciones simultáneas', async () => {
    const csrf = countRequests('get', '/api/auth/csrf', () =>
      HttpResponse.json({ csrf_token: TEST_CSRF_TOKEN }),
    );
    countRequests('post', '/api/things', () => HttpResponse.json({}));

    await Promise.all([
      apiFetch('/api/things', { method: 'POST' }),
      apiFetch('/api/things', { method: 'POST' }),
    ]);

    expect(csrf).toHaveLength(1);
  });

  it('no envía la mutación si el API no entrega el token', async () => {
    server.use(http.get(apiUrl('/api/auth/csrf'), () => HttpResponse.json({})));
    const calls = countRequests('post', '/api/things', () =>
      HttpResponse.json({}),
    );

    const error = await captureError(
      apiFetch('/api/things', { method: 'POST' }),
    );

    expect(calls).toHaveLength(0);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe(UNEXPECTED_RESPONSE_CODE);
  });
});

describe('apiFetch: respuestas', () => {
  it('convierte un error con la forma común en ApiError', async () => {
    countRequests('get', '/api/things', () =>
      HttpResponse.json(errorBody('stale_version', { name: ['Ya existe.'] }), {
        status: 409,
      }),
    );

    const error = (await captureError(apiFetch('/api/things'))) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(error.code).toBe('stale_version');
    expect(error.fields).toEqual({ name: ['Ya existe.'] });
    expect(error.message).toBe('Mensaje del API');
  });

  it('marca como inesperado un error que no viene del API', async () => {
    countRequests(
      'get',
      '/api/things',
      () => new HttpResponse('<html>Bad gateway</html>', { status: 502 }),
    );

    const error = (await captureError(apiFetch('/api/things'))) as ApiError;

    expect(error.code).toBe(UNEXPECTED_RESPONSE_CODE);
    expect(error.status).toBe(502);
  });

  it('marca como inesperado un 2xx que no es JSON', async () => {
    countRequests(
      'get',
      '/api/things',
      () => new HttpResponse('<html>Portal</html>', { status: 200 }),
    );

    const error = (await captureError(apiFetch('/api/things'))) as ApiError;

    expect(error.code).toBe(UNEXPECTED_RESPONSE_CODE);
  });

  it('deja pasar el fallo de red como TypeError', async () => {
    countRequests('get', '/api/things', () => HttpResponse.error());

    const error = await captureError(apiFetch('/api/things'));

    expect(isNetworkFailure(error)).toBe(true);
  });

  it('devuelve undefined en un 204', async () => {
    countRequests(
      'post',
      '/api/things',
      () => new HttpResponse(null, { status: 204 }),
    );

    await expect(
      apiFetch('/api/things', { method: 'POST' }),
    ).resolves.toBeUndefined();
  });
});

describe('apiFetch: renovación de la sesión', () => {
  it('renueva una sola vez ante varios 401 simultáneos y reintenta cada petición', async () => {
    let renewed = false;
    const refresh = countRequests('post', '/api/auth/refresh', () => {
      renewed = true;
      return new HttpResponse(null, { status: 204 });
    });
    const calls = countRequests('get', '/api/things', () =>
      renewed
        ? HttpResponse.json(['ok'])
        : HttpResponse.json(errorBody('authentication_failed'), {
            status: 401,
          }),
    );

    const results = await Promise.all([
      apiFetch('/api/things'),
      apiFetch('/api/things'),
      apiFetch('/api/things'),
    ]);

    expect(refresh).toHaveLength(1);
    expect(calls).toHaveLength(6);
    expect(results).toEqual([['ok'], ['ok'], ['ok']]);
  });

  it('falla con 401 si la renovación también falla', async () => {
    countRequests('post', '/api/auth/refresh', () =>
      HttpResponse.json(errorBody('authentication_failed'), { status: 401 }),
    );
    countRequests('get', '/api/things', () =>
      HttpResponse.json(errorBody('authentication_failed'), { status: 401 }),
    );

    const error = (await captureError(apiFetch('/api/things'))) as ApiError;

    expect(error.status).toBe(401);
  });

  it('reintenta una vez si otra pestaña ya renovó la sesión', async () => {
    countRequests('post', '/api/auth/refresh', () =>
      HttpResponse.json(errorBody('authentication_failed'), { status: 401 }),
    );
    let attempts = 0;
    const calls = countRequests('get', '/api/things', () =>
      ++attempts === 1
        ? HttpResponse.json(errorBody('authentication_failed'), {
            status: 401,
          })
        : HttpResponse.json(['ok']),
    );

    const result = await apiFetch('/api/things');

    expect(result).toEqual(['ok']);
    expect(calls).toHaveLength(2);
  });

  it('no reintenta más de una vez cuando la renovación falla', async () => {
    countRequests('post', '/api/auth/refresh', () =>
      HttpResponse.json(errorBody('authentication_failed'), { status: 401 }),
    );
    const calls = countRequests('get', '/api/things', () =>
      HttpResponse.json(errorBody('authentication_failed'), { status: 401 }),
    );

    const error = (await captureError(apiFetch('/api/things'))) as ApiError;

    expect(error.status).toBe(401);
    expect(calls).toHaveLength(2);
  });

  it('no reintenta si no hay cookie de renovación', async () => {
    countRequests('post', '/api/auth/refresh', () =>
      HttpResponse.json(errorBody('not_authenticated'), { status: 401 }),
    );
    const calls = countRequests('get', '/api/things', () =>
      HttpResponse.json(errorBody('not_authenticated'), { status: 401 }),
    );

    const error = (await captureError(apiFetch('/api/things'))) as ApiError;

    expect(error.code).toBe('not_authenticated');
    expect(calls).toHaveLength(1);
  });

  it('no reintenta si la renovación falla por un error del servidor', async () => {
    countRequests('post', '/api/auth/refresh', () =>
      HttpResponse.json(errorBody('internal_error'), { status: 500 }),
    );
    const calls = countRequests('get', '/api/things', () =>
      HttpResponse.json(errorBody('authentication_failed'), { status: 401 }),
    );

    const error = (await captureError(apiFetch('/api/things'))) as ApiError;

    expect(error.status).toBe(500);
    expect(calls).toHaveLength(1);
  });

  it('no renueva cuando el login responde 401', async () => {
    const refresh = countRequests(
      'post',
      '/api/auth/refresh',
      () => new HttpResponse(null, { status: 204 }),
    );
    countRequests('post', '/api/auth/login', () =>
      HttpResponse.json(errorBody('invalid_credentials'), { status: 401 }),
    );

    const error = (await captureError(
      apiFetch('/api/auth/login', { method: 'POST' }),
    )) as ApiError;

    expect(error.code).toBe('invalid_credentials');
    expect(refresh).toHaveLength(0);
  });

  it('no renueva cuando el ingreso con Google responde 401', async () => {
    const refresh = countRequests(
      'post',
      '/api/auth/refresh',
      () => new HttpResponse(null, { status: 204 }),
    );
    countRequests('get', '/api/auth/google/start', () =>
      HttpResponse.json(errorBody('authentication_failed'), { status: 401 }),
    );

    await captureError(apiFetch('/api/auth/google/start'));

    expect(refresh).toHaveLength(0);
  });

  it('sí renueva cuando /api/auth/me responde 401', async () => {
    let renewed = false;
    const refresh = countRequests('post', '/api/auth/refresh', () => {
      renewed = true;
      return new HttpResponse(null, { status: 204 });
    });
    countRequests('get', '/api/auth/me', () =>
      renewed
        ? HttpResponse.json({ id: 1 })
        : HttpResponse.json(errorBody('authentication_failed'), {
            status: 401,
          }),
    );

    await expect(apiFetch('/api/auth/me')).resolves.toEqual({ id: 1 });
    expect(refresh).toHaveLength(1);
  });

  it('el cierre de sesión espera a una renovación en vuelo', async () => {
    const order: string[] = [];
    server.use(
      http.post(apiUrl('/api/auth/refresh'), async () => {
        await delay(50);
        order.push('refresh');
        return new HttpResponse(null, { status: 204 });
      }),
      http.post(apiUrl('/api/auth/logout'), () => {
        order.push('logout');
        return new HttpResponse(null, { status: 204 });
      }),
    );
    let renewed = false;
    countRequests('get', '/api/things', () => {
      if (renewed) return HttpResponse.json([]);
      renewed = true;
      return HttpResponse.json(errorBody('authentication_failed'), {
        status: 401,
      });
    });

    const pending = apiFetch('/api/things');
    await delay(10);
    await apiFetch('/api/auth/logout', { method: 'POST' });
    await pending.catch(() => undefined);

    expect(order).toEqual(['refresh', 'logout']);
  });
});
