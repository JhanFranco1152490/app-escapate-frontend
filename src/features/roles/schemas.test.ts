import { describe, expect, it } from 'vitest';

import { roleFormSchema } from './schemas';

describe('roleFormSchema', () => {
  it('recorta el nombre y deja la descripción vacía en null', () => {
    expect(
      roleFormSchema.parse({
        name: '  Ventas ',
        description: '  ',
        permissions: ['users.view'],
      }),
    ).toEqual({
      name: 'Ventas',
      description: null,
      permissions: ['users.view'],
    });
  });

  it('el nombre es obligatorio y de máximo 80 caracteres', () => {
    const empty = roleFormSchema.safeParse({
      name: ' ',
      description: '',
      permissions: [],
    });
    const long = roleFormSchema.safeParse({
      name: 'a'.repeat(81),
      description: '',
      permissions: [],
    });

    expect(empty.error?.issues[0]).toMatchObject({
      path: ['name'],
      message: 'Este campo es obligatorio.',
    });
    expect(long.error?.issues[0]?.message).toBe('Máximo 80 caracteres.');
  });

  it('la descripción es de máximo 200 caracteres', () => {
    const result = roleFormSchema.safeParse({
      name: 'Ventas',
      description: 'a'.repeat(201),
      permissions: [],
    });

    expect(result.error?.issues[0]).toMatchObject({
      path: ['description'],
      message: 'Máximo 200 caracteres.',
    });
  });

  it('un rol sin permisos es válido', () => {
    expect(
      roleFormSchema.safeParse({
        name: 'Ventas',
        description: '',
        permissions: [],
      }).success,
    ).toBe(true);
  });
});
