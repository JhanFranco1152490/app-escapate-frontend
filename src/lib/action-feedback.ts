import { RATE_LIMIT_MESSAGE, isApiError } from '@/lib/api/errors';

export type ActionFeedback = { variant: 'info' | 'error'; text: string };

const GENERIC_ACTION_ERROR =
  'No pudimos completar la acción. Inténtalo de nuevo.';

// Los conflictos (409) y el fallo del correo (502) traen un motivo pensado para mostrarse;
// cualquier otro error usa el mensaje genérico. Se decide por el status, no por el texto.
export function actionErrorMessage(error: unknown) {
  if (!isApiError(error)) return GENERIC_ACTION_ERROR;
  if (error.code === 'throttled') return RATE_LIMIT_MESSAGE;
  if (error.status === 409 || error.status === 502) return error.message;
  return GENERIC_ACTION_ERROR;
}

export const actionError = (error: unknown): ActionFeedback => ({
  variant: 'error',
  text: actionErrorMessage(error),
});
