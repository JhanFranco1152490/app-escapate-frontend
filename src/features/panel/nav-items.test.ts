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

  it('"Roles y permisos" aparece con roles.view, después de "Usuarios"', () => {
    const groups = visibleNavGroups(
      buildSession({ permissions: ['users.view', 'roles.view'] }),
    );

    expect(groups[1].items.map((item) => item.label)).toEqual([
      'Usuarios',
      'Roles y permisos',
    ]);
    expect(groups[1].items[1].href).toBe('/roles');
  });

  it('"Proveedores" aparece en "Oferta turística" con suppliers.view, entre Operación y Administración', () => {
    const groups = visibleNavGroups(
      buildSession({ permissions: ['suppliers.view', 'users.view'] }),
    );

    expect(groups.map((group) => group.label)).toEqual([
      'Operación',
      'Oferta turística',
      'Administración',
    ]);
    expect(groups[1].items.map((item) => [item.label, item.href])).toEqual([
      ['Proveedores', '/proveedores'],
    ]);
  });

  it('"Clientes" y "Viajeros" aparecen en Operación con su permiso, después de "Inicio"', () => {
    const groups = visibleNavGroups(
      buildSession({ permissions: ['clients.view', 'travelers.view'] }),
    );

    expect(groups.map((group) => group.label)).toEqual(['Operación']);
    expect(groups[0].items.map((item) => [item.label, item.href])).toEqual([
      ['Inicio', '/'],
      ['Clientes', '/clientes'],
      ['Viajeros', '/viajeros'],
    ]);
  });

  it('cada una pide solo su propio permiso', () => {
    const labels = (permissions: string[]) =>
      visibleNavGroups(buildSession({ permissions }))[0].items.map(
        (item) => item.label,
      );

    expect(labels(['clients.view'])).toEqual(['Inicio', 'Clientes']);
    expect(labels(['travelers.view'])).toEqual(['Inicio', 'Viajeros']);
  });

  it('sin roles.view no aparece "Roles y permisos"', () => {
    const groups = visibleNavGroups(
      buildSession({ permissions: ['users.view'] }),
    );

    expect(groups[1].items.map((item) => item.label)).not.toContain(
      'Roles y permisos',
    );
  });
});
