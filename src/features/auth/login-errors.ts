import type { AlertVariant } from '@/components/alert';
import {
  RATE_LIMIT_MESSAGE,
  getErrorMessage,
  isApiError,
} from '@/lib/api/errors';

export type LoginNotice = { variant: AlertVariant; message: string };

export const GENERIC_LOGIN_NOTICE: LoginNotice = {
  variant: 'error',
  message: 'No pudimos iniciar sesión. Inténtalo de nuevo.',
};

// Un solo mapa para las dos vías: el code de la API (documento) y el parámetro error con el
// que la API devuelve al login cuando falla el ingreso con Google.
const NOTICES = new Map<string, LoginNotice>([
  [
    'invalid_credentials',
    {
      variant: 'error',
      message:
        'El documento o la contraseña no son válidos. Revísalos e inténtalo de nuevo.',
    },
  ],
  [
    'account_inactive',
    {
      variant: 'info',
      message:
        'Tu cuenta está inactiva. Si crees que es un error, escribe a un administrador de la agencia.',
    },
  ],
  [
    'account_locked',
    {
      variant: 'error',
      message:
        'Demasiados intentos fallidos. Inténtalo de nuevo en 15 minutos.',
    },
  ],
  ['throttled', { variant: 'error', message: RATE_LIMIT_MESSAGE }],
  [
    'account_not_registered',
    {
      variant: 'info',
      message:
        'Esta cuenta de Google no tiene acceso a Escápate. Pide a un administrador que te registre con ese correo.',
    },
  ],
  [
    'google_cancelled',
    { variant: 'info', message: 'Cancelaste el inicio de sesión con Google.' },
  ],
  [
    'google_failed',
    {
      variant: 'error',
      message:
        'No pudimos validar tu cuenta de Google. Inténtalo de nuevo o entra con tu documento.',
    },
  ],
]);

// En estos el texto del servidor dice cuánto esperar, y ese plazo lo decide la API.
const SERVER_DETAIL_CODES = new Set(['account_locked', 'throttled']);

export function loginNoticeFromError(error: unknown): LoginNotice {
  if (!isApiError(error)) return GENERIC_LOGIN_NOTICE;
  const notice = NOTICES.get(error.code);
  if (!notice) return GENERIC_LOGIN_NOTICE;
  if (!SERVER_DETAIL_CODES.has(error.code)) return notice;
  return { ...notice, message: getErrorMessage(error, notice.message) };
}

// Un código que no está en el mapa no muestra nada: el parámetro viene en la URL y cualquiera
// puede escribir ahí lo que quiera.
export function loginNoticeFromUrl(
  code: string | null | undefined,
): LoginNotice | undefined {
  return code ? NOTICES.get(code) : undefined;
}
