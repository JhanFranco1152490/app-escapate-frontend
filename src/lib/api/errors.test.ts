import { describe, expect, it } from 'vitest';

import {
  ApiError,
  RATE_LIMIT_MESSAGE,
  getErrorMessage,
  isNetworkFailure,
  isStaleVersion,
  isUnauthorized,
  rateLimitOr,
} from './errors';

const apiError = (status: number, code: string) =>
  new ApiError(status, { detail: 'Mensaje del API', code, fields: {} });

describe('getErrorMessage', () => {
  it('usa el detail del API', () => {
    expect(getErrorMessage(apiError(409, 'stale_version'), 'Algo falló')).toBe(
      'Mensaje del API',
    );
  });

  it('usa el mensaje propio cuando el API limita las solicitudes', () => {
    expect(getErrorMessage(apiError(429, 'throttled'), 'Algo falló')).toBe(
      RATE_LIMIT_MESSAGE,
    );
  });

  it('cae al mensaje de respaldo si el error no viene del API', () => {
    expect(getErrorMessage(new Error('boom'), 'Algo falló')).toBe('Algo falló');
  });
});

describe('clasificación de errores', () => {
  it('reconoce un 401 del API', () => {
    expect(isUnauthorized(apiError(401, 'authentication_failed'))).toBe(true);
    expect(isUnauthorized(apiError(403, 'permission_denied'))).toBe(false);
  });

  it('reconoce un 409 stale_version y no otro conflicto', () => {
    expect(isStaleVersion(apiError(409, 'stale_version'))).toBe(true);
    expect(isStaleVersion(apiError(409, 'role_in_use'))).toBe(false);
    expect(isStaleVersion(new Error('boom'))).toBe(false);
  });

  it('reconoce un fallo de red', () => {
    expect(isNetworkFailure(new TypeError('Failed to fetch'))).toBe(true);
    expect(isNetworkFailure(apiError(500, 'internal_error'))).toBe(false);
  });
});

describe('rateLimitOr', () => {
  it('con throttled usa el mensaje de límite y si no, el genérico', () => {
    expect(rateLimitOr(apiError(429, 'throttled'), 'Genérico.')).toBe(
      RATE_LIMIT_MESSAGE,
    );
    expect(rateLimitOr(apiError(500, 'internal_error'), 'Genérico.')).toBe(
      'Genérico.',
    );
    expect(rateLimitOr(new TypeError('Failed to fetch'), 'Genérico.')).toBe(
      'Genérico.',
    );
  });
});
