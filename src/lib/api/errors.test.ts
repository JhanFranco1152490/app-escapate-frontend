import { describe, expect, it } from 'vitest';

import {
  ApiError,
  RATE_LIMIT_MESSAGE,
  getErrorMessage,
  isNetworkFailure,
  isUnauthorized,
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

  it('reconoce un fallo de red', () => {
    expect(isNetworkFailure(new TypeError('Failed to fetch'))).toBe(true);
    expect(isNetworkFailure(apiError(500, 'internal_error'))).toBe(false);
  });
});
