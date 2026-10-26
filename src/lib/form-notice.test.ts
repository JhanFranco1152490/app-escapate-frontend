import { describe, expect, it } from 'vitest';

import { invalidFormNotice } from './form-notice';

const required = { type: 'too_small', message: 'Este campo es obligatorio.' };

describe('invalidFormNotice', () => {
  it('cuenta los campos obligatorios que faltan', () => {
    expect(
      invalidFormNotice(
        { first_name: required, phone: required },
        { subject: 'el cliente' },
      ),
    ).toEqual({
      title: 'Faltan 2 campos obligatorios.',
      body: 'Completa los campos marcados para guardar el cliente.',
    });
    expect(
      invalidFormNotice({ first_name: required }, { subject: 'el cliente' })
        .title,
    ).toBe('Falta 1 campo obligatorio.');
  });

  it('cuenta también los mensajes propios que piden un dato', () => {
    const notice = invalidFormNotice(
      {
        role_id: { type: 'too_small', message: 'Selecciona un rol.' },
        email: { type: 'custom', message: 'No es un correo válido.' },
      },
      { subject: 'el usuario', requiredMessages: ['Selecciona un rol.'] },
    );

    expect(notice.title).toBe('Falta 1 campo obligatorio.');
  });

  it('sin campos faltantes pide revisar los formatos', () => {
    expect(
      invalidFormNotice(
        { email: { type: 'custom', message: 'No es un correo válido.' } },
        { subject: 'el cliente' },
      ),
    ).toEqual({ title: 'Revisa los campos marcados.' });
  });
});
