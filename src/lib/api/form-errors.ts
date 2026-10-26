import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form';

import { isApiError } from './errors';

export type ApiFieldErrorsResult = {
  applied: boolean;
  // Mensajes de los campos que el formulario no tiene: no quedan en ningún campo, así que
  // quien llama debe mostrarlos en otro lado (un aviso general) o se pierden.
  unmatched: string[];
};

// Vuelca los errores por campo del servidor a react-hook-form. Solo aplica los campos que
// el formulario conoce (el primer mensaje de cada uno); dice si aplicó alguno y devuelve los
// mensajes de los que no conoce.
export function applyApiFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  allowed: readonly string[],
): ApiFieldErrorsResult {
  const result: ApiFieldErrorsResult = { applied: false, unmatched: [] };
  if (!isApiError(error)) return result;
  for (const [field, messages] of Object.entries(error.fields)) {
    if (!allowed.includes(field)) {
      result.unmatched.push(...messages);
    } else if (messages[0]) {
      setError(field as FieldPath<T>, { type: 'server', message: messages[0] });
      result.applied = true;
    }
  }
  return result;
}

export type ApiFormErrorResult<Field extends string> = {
  isValidation: boolean;
  // El error no quedó entero en los campos: no es de validación, no marcó ninguno o trajo
  // campos que el formulario no tiene. Quien llama muestra un aviso general.
  needsNotice: boolean;
  firstInvalid: Field | undefined;
};

// Lo que hace cada formulario al recibir un error de la API: marcar los campos y decidir si
// hace falta un aviso general y a qué campo llevar el foco.
export function applyApiFormError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly FieldPath<T>[],
): ApiFormErrorResult<FieldPath<T>> {
  const { applied, unmatched } = applyApiFieldErrors(error, setError, fields);
  const isValidation = isApiError(error) && error.code === 'validation_error';
  return {
    isValidation,
    needsNotice: !isValidation || !applied || unmatched.length > 0,
    firstInvalid: isApiError(error)
      ? fields.find((field) => error.fields[field]?.length)
      : undefined,
  };
}
