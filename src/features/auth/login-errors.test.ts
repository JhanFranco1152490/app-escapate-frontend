import { describe, expect, it } from 'vitest';

import { ApiError, RATE_LIMIT_MESSAGE } from '@/lib/api/errors';

import {
  GENERIC_LOGIN_NOTICE,
  loginNoticeFromError,
  loginNoticeFromUrl,
} from './login-errors';

const LOCKED_NOTICE = {
  variant: 'error',
  message: 'Demasiados intentos fallidos.',
  recovery: true,
};

const apiError = (status: number, code: string, detail = 'Detalle del API') =>
  new ApiError(status, { detail, code, fields: {} });

describe('loginNoticeFromError', () => {
  it('credenciales no válidas: error con el texto propio', () => {
    expect(loginNoticeFromError(apiError(401, 'invalid_credentials'))).toEqual({
      variant: 'error',
      message:
        'El documento o la contraseña no son válidos. Revísalos e inténtalo de nuevo.',
    });
  });

  it('cuenta inactiva: aviso informativo', () => {
    expect(loginNoticeFromError(apiError(403, 'account_inactive'))).toEqual({
      variant: 'info',
      message:
        'Tu cuenta está inactiva. Si crees que es un error, escribe a un administrador de la agencia.',
    });
  });

  it('cuenta bloqueada: texto propio que ofrece las salidas', () => {
    expect(loginNoticeFromError(apiError(429, 'account_locked'))).toEqual(
      LOCKED_NOTICE,
    );
  });

  it('límite de solicitudes: usa el mensaje común del cliente', () => {
    expect(loginNoticeFromError(apiError(429, 'throttled'))).toEqual({
      variant: 'error',
      message: RATE_LIMIT_MESSAGE,
    });
  });

  it.each([
    ['un code desconocido', apiError(500, 'internal_error')],
    ['un error de validación', apiError(422, 'validation_error')],
    ['un fallo de red', new TypeError('Failed to fetch')],
    ['un error cualquiera', new Error('boom')],
  ])('cae al aviso genérico ante %s', (_, error) => {
    expect(loginNoticeFromError(error)).toEqual(GENERIC_LOGIN_NOTICE);
  });
});

describe('loginNoticeFromUrl', () => {
  it.each([
    ['google_cancelled', 'info', 'Cancelaste el inicio de sesión con Google.'],
    [
      'google_failed',
      'error',
      'No pudimos validar tu cuenta de Google. Inténtalo de nuevo o entra con tu documento.',
    ],
    [
      'account_not_registered',
      'info',
      'Esta cuenta de Google no tiene acceso a Escápate. Pide a un administrador que te registre con ese correo.',
    ],
    [
      'account_inactive',
      'info',
      'Tu cuenta está inactiva. Si crees que es un error, escribe a un administrador de la agencia.',
    ],
    ['throttled', 'error', RATE_LIMIT_MESSAGE],
  ])('muestra el aviso de %s', (code, variant, message) => {
    expect(loginNoticeFromUrl(code)).toEqual({ variant, message });
  });

  it('muestra el aviso de account_locked con las salidas', () => {
    expect(loginNoticeFromUrl('account_locked')).toEqual(LOCKED_NOTICE);
  });

  it.each([
    'texto arbitrario',
    'validation_error',
    'constructor',
    '__proto__',
    'toString',
    '',
  ])('ignora el código desconocido %j', (code) => {
    expect(loginNoticeFromUrl(code)).toBeUndefined();
  });

  it('no muestra nada sin código', () => {
    expect(loginNoticeFromUrl(null)).toBeUndefined();
  });
});
