import type { FieldErrors } from 'react-hook-form';

import { REQUIRED_MESSAGE, ROLE_REQUIRED_MESSAGE } from './schemas';

export type FormNotice = { title: string; body?: string };

const REVIEW_FIELDS = 'Revisa los campos marcados.';

// Aviso arriba del formulario cuando el navegador rechaza el envío: cuántos campos
// obligatorios faltan o, si están todos, que hay formatos por corregir.
export function invalidFormNotice(errors: FieldErrors): FormNotice {
  const missing = Object.values(errors).filter(
    (error) =>
      error?.message === REQUIRED_MESSAGE ||
      error?.message === ROLE_REQUIRED_MESSAGE,
  ).length;
  if (missing === 0) return { title: REVIEW_FIELDS };
  return {
    title:
      missing === 1
        ? 'Falta 1 campo obligatorio.'
        : `Faltan ${missing} campos obligatorios.`,
    body: 'Completa los campos marcados para guardar el usuario.',
  };
}

export const SERVER_FIELDS_NOTICE: FormNotice = { title: REVIEW_FIELDS };
