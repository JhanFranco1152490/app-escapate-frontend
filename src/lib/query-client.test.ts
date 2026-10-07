import { MutationObserver } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/errors';
import { queryKeys } from '@/lib/api/query-keys';

import { createQueryClient } from './query-client';

const apiError = (status: number) =>
  new ApiError(status, { detail: 'x', code: 'x', fields: {} });

function retryOf(client = createQueryClient()) {
  const retry = client.getDefaultOptions().queries?.retry;
  if (typeof retry !== 'function')
    throw new Error('retry debe ser una función');
  return retry;
}

describe('createQueryClient: reintentos', () => {
  it('no reintenta un error 4xx del API', () => {
    expect(retryOf()(0, apiError(404))).toBe(false);
    expect(retryOf()(0, apiError(401))).toBe(false);
  });

  it('reintenta una sola vez un 5xx o un fallo de red', () => {
    const retry = retryOf();

    expect(retry(0, apiError(503))).toBe(true);
    expect(retry(1, apiError(503))).toBe(false);
    expect(retry(0, new TypeError('Failed to fetch'))).toBe(true);
    expect(retry(1, new TypeError('Failed to fetch'))).toBe(false);
  });
});

describe('createQueryClient: sesión vencida', () => {
  it('un 401 en una consulta invalida la sesión', async () => {
    const client = createQueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');

    await client
      .fetchQuery({
        queryKey: ['things'],
        queryFn: () => Promise.reject(apiError(401)),
      })
      .catch(() => undefined);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.session() });
  });

  it('un 401 en una mutación invalida la sesión', async () => {
    const client = createQueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const observer = new MutationObserver(client, {
      mutationFn: () => Promise.reject(apiError(401)),
    });

    await observer.mutate().catch(() => undefined);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryKeys.session() });
  });

  it('la consulta de la sesión no se invalida a sí misma', async () => {
    const client = createQueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');

    await client
      .fetchQuery({
        queryKey: queryKeys.session(),
        queryFn: () => Promise.reject(apiError(401)),
      })
      .catch(() => undefined);

    expect(invalidate).not.toHaveBeenCalled();
  });

  it('otros errores no tocan la sesión', async () => {
    const client = createQueryClient();
    const invalidate = vi.spyOn(client, 'invalidateQueries');

    await client
      .fetchQuery({
        queryKey: ['things'],
        queryFn: () => Promise.reject(apiError(403)),
      })
      .catch(() => undefined);

    expect(invalidate).not.toHaveBeenCalled();
  });
});
