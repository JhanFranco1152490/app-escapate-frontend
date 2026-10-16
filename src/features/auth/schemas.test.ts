import { describe, expect, it } from 'vitest';

import { setPasswordSchema } from './schemas';

const LONG = 'una frase larga de prueba';

// Primer mensaje de cada campo, que es el que muestra el formulario.
function messagesFor(values: {
  password: string;
  password_confirmation: string;
}) {
  const result = setPasswordSchema.safeParse(values);
  const messages: Record<string, string> = {};
  if (result.success) return messages;
  for (const issue of result.error.issues) {
    messages[issue.path.join('.')] ??= issue.message;
  }
  return messages;
}

describe('setPasswordSchema', () => {
  it('acepta dos contraseñas iguales de 12 caracteres o más', () => {
    expect(
      setPasswordSchema.safeParse({
        password: LONG,
        password_confirmation: LONG,
      }).success,
    ).toBe(true);
  });

  it('marca la confirmación cuando no coinciden', () => {
    expect(
      messagesFor({ password: LONG, password_confirmation: `${LONG}!` }),
    ).toEqual({ password_confirmation: 'Las contraseñas no coinciden.' });
  });

  it('exige al menos 12 caracteres', () => {
    expect(
      messagesFor({ password: 'corta', password_confirmation: 'corta' }),
    ).toMatchObject({ password: 'Usa al menos 12 caracteres.' });
  });

  it('exige la confirmación', () => {
    expect(
      messagesFor({ password: LONG, password_confirmation: '' }),
    ).toMatchObject({ password_confirmation: 'Confirma la contraseña.' });
  });

  it('no recorta espacios: cuentan como parte de la contraseña', () => {
    const padded = '   espacios   ';
    expect(
      setPasswordSchema.safeParse({
        password: padded,
        password_confirmation: padded.trim(),
      }).success,
    ).toBe(false);
  });
});
