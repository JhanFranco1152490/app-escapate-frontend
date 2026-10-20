import { describe, expect, it } from 'vitest';

import { buildSession } from '@/test/session';

import { NAV_ITEMS, isNavItemActive, visibleNavGroups } from './nav-items';

const usersItem = NAV_ITEMS.find((item) => item.href === '/usuarios')!;
const homeItem = NAV_ITEMS.find((item) => item.href === '/')!;

describe('isNavItemActive', () => {
  it('la entrada de inicio solo coincide con la raíz', () => {
    expect(isNavItemActive(homeItem, '/')).toBe(true);
    expect(isNavItemActive(homeItem, '/usuarios')).toBe(false);
  });

  it('una entrada coincide con su ruta y sus subrutas', () => {
    expect(isNavItemActive(usersItem, '/usuarios')).toBe(true);
    expect(isNavItemActive(usersItem, '/usuarios/5/editar')).toBe(true);
  });

  it('no coincide con una ruta que solo empieza igual', () => {
    expect(isNavItemActive(usersItem, '/usuarios-viejos')).toBe(false);
  });
});

describe('visibleNavGroups', () => {
  it('sin el permiso no incluye la entrada ni su grupo vacío', () => {
    const groups = visibleNavGroups(buildSession({ permissions: [] }));

    expect(groups.map((group) => group.label)).toEqual(['Operación']);
    expect(groups[0].items.map((item) => item.label)).toEqual(['Inicio']);
  });

  it('con el permiso incluye la entrada en su grupo', () => {
    const groups = visibleNavGroups(
      buildSession({ permissions: ['users.view'] }),
    );

    expect(groups.map((group) => group.label)).toEqual([
      'Operación',
      'Administración',
    ]);
    expect(groups[1].items.map((item) => item.label)).toEqual(['Usuarios']);
  });
});
