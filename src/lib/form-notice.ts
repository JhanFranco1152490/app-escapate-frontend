import type { FieldErrors } from 'react-hook-form';

import { REQUIRED_MESSAGE } from './validation/text';

export type FormNotice = { title: string; body?: string };

const REVIEW_FIELDS = 'Revisa los campos marcados.';

type InvalidFormNoticeOptions = {
  // Lo que se guarda, para el cuerpo del aviso: "el usuario", "el cliente".
  subject: string;
  // Mensajes propios de un campo que también significan "falta este dato" ("Selecciona un
  // rol.", "Cuéntanos cuál.").
  requiredMessages?: string[];
};

// Aviso arriba del formulario cuando el navegador rechaza el envío: cuántos campos
// obligatorios faltan o, si están todos, que hay formatos por corregir.
export function invalidFormNotice(
  errors: FieldErrors,
  { subject, requiredMessages = [] }: InvalidFormNoticeOptions,
): FormNotice {
  const missingMessages = [REQUIRED_MESSAGE, ...requiredMessages];
  const missing = Object.values(errors).filter(
    (error) =>
      typeof error?.message === 'string' &&
      missingMessages.includes(error.message),
  ).length;
  if (missing === 0) return { title: REVIEW_FIELDS };
  return {
    title:
      missing === 1
        ? 'Falta 1 campo obligatorio.'
        : `Faltan ${missing} campos obligatorios.`,
    body: `Completa los campos marcados para guardar ${subject}.`,
  };
}

export const SERVER_FIELDS_NOTICE: FormNotice = { title: REVIEW_FIELDS };
