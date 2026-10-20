import { describe, expect, it, vi } from 'vitest';

import { ApiError } from './errors';
import { applyApiFieldErrors, applyApiFormError } from './form-errors';

const withFields = (fields: Record<string, string[]>) =>
  new ApiError(422, {
    detail: 'Revisa los datos enviados.',
    code: 'validation_error',
    fields,
  });

describe('applyApiFieldErrors', () => {
  it('aplica el primer mensaje de cada campo que el formulario conoce', () => {
    const setError = vi.fn();

    const result = applyApiFieldErrors(
      withFields({ email: ['Correo inválido.', 'Otro mensaje'] }),
      setError,
      ['email', 'name'],
    );

    expect(setError).toHaveBeenCalledExactlyOnceWith('email', {
      type: 'server',
      message: 'Correo inválido.',
    });
    expect(result).toEqual({ applied: true, unmatched: [] });
  });

  it('devuelve los mensajes de campos que el formulario no tiene', () => {
    const setError = vi.fn();

    const result = applyApiFieldErrors(
      withFields({ token: ['Vencido.'] }),
      setError,
      ['email'],
    );

    expect(setError).not.toHaveBeenCalled();
    expect(result).toEqual({ applied: false, unmatched: ['Vencido.'] });
  });

  it('no hace nada si el error no viene del API', () => {
    const setError = vi.fn();

    const result = applyApiFieldErrors(new Error('boom'), setError, ['email']);

    expect(setError).not.toHaveBeenCalled();
    expect(result).toEqual({ applied: false, unmatched: [] });
  });
});

describe('applyApiFormError', () => {
  const FIELDS = ['email', 'name'] as const;

  it('un error de validación con campos conocidos no necesita aviso', () => {
    const result = applyApiFormError(
      withFields({ name: ['Ingresa tu nombre.'] }),
      vi.fn(),
      FIELDS,
    );

    expect(result).toEqual({
      isValidation: true,
      needsNotice: false,
      firstInvalid: 'name',
    });
  });

  it('pide aviso si trae campos que el formulario no tiene', () => {
    const result = applyApiFormError(
      withFields({ name: ['Ingresa tu nombre.'], phone: ['Otro.'] }),
      vi.fn(),
      FIELDS,
    );

    expect(result.needsNotice).toBe(true);
  });

  it('pide aviso si no es de validación', () => {
    const result = applyApiFormError(
      new ApiError(429, { detail: 'Espera.', code: 'throttled', fields: {} }),
      vi.fn(),
      FIELDS,
    );

    expect(result).toEqual({
      isValidation: false,
      needsNotice: true,
      firstInvalid: undefined,
    });
  });

  it('sin respuesta de la API pide aviso', () => {
    expect(
      applyApiFormError(new TypeError('Failed to fetch'), vi.fn(), FIELDS),
    ).toEqual({
      isValidation: false,
      needsNotice: true,
      firstInvalid: undefined,
    });
  });
});
