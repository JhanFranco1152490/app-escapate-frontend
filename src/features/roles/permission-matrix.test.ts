import { describe, expect, it } from 'vitest';

import { PERMISSION_CATALOG } from '@/test/roles';

import type { PermissionItem } from './api';
import {
  grantsSummary,
  groupCatalog,
  togglePermission,
} from './permission-matrix';

function permission(
  code: string,
  group: string,
  label: string,
  requires: string[] = [],
  section = 'Operación',
): PermissionItem {
  return {
    code,
    section,
    group,
    label,
    description: `${label} ${group}`,
    requires,
    help: null,
  };
}

// Una cadena de tres: aprobar necesita editar, que necesita ver.
const CHAIN = [
  permission('quotes.view', 'Cotizaciones', 'Ver'),
  permission('quotes.edit', 'Cotizaciones', 'Editar', ['quotes.view']),
  permission('quotes.approve', 'Cotizaciones', 'Aprobar', ['quotes.edit']),
];

describe('groupCatalog', () => {
  it('agrupa por sección y grupo en el orden del catálogo', () => {
    const catalog = [
      permission('clients.view', 'Clientes', 'Ver', [], 'CRM'),
      ...PERMISSION_CATALOG,
      permission('clients.manage', 'Clientes', 'Gestionar', [], 'CRM'),
    ];

    const sections = groupCatalog(catalog);

    expect(sections.map((section) => section.name)).toEqual([
      'CRM',
      'Administración',
    ]);
    expect(sections[0].groups).toEqual([
      { name: 'Clientes', permissions: [catalog[0], catalog[5]] },
    ]);
    expect(sections[1].groups.map((group) => group.name)).toEqual([
      'Usuarios',
      'Roles y permisos',
    ]);
    expect(sections[1].groups[0].permissions.map((item) => item.label)).toEqual(
      ['Ver', 'Gestionar'],
    );
  });

  it('un catálogo vacío no tiene secciones', () => {
    expect(groupCatalog([])).toEqual([]);
  });
});

describe('togglePermission', () => {
  it('marcar "Gestionar" marca también "Ver"', () => {
    expect(
      togglePermission([], 'users.manage', true, PERMISSION_CATALOG),
    ).toEqual(['users.view', 'users.manage']);
  });

  it('desmarcar "Ver" desmarca también "Gestionar"', () => {
    expect(
      togglePermission(
        ['users.view', 'users.manage', 'roles.view'],
        'users.view',
        false,
        PERMISSION_CATALOG,
      ),
    ).toEqual(['roles.view']);
  });

  it('desmarcar "Gestionar" deja "Ver"', () => {
    expect(
      togglePermission(
        ['users.view', 'users.manage'],
        'users.manage',
        false,
        PERMISSION_CATALOG,
      ),
    ).toEqual(['users.view']);
  });

  it('sigue las dependencias en cadena al marcar y al desmarcar', () => {
    expect(togglePermission([], 'quotes.approve', true, CHAIN)).toEqual([
      'quotes.view',
      'quotes.edit',
      'quotes.approve',
    ]);
    expect(
      togglePermission(
        ['quotes.view', 'quotes.edit', 'quotes.approve'],
        'quotes.view',
        false,
        CHAIN,
      ),
    ).toEqual([]);
  });

  it('devuelve los códigos en el orden del catálogo, sin repetidos', () => {
    expect(
      togglePermission(
        ['roles.view', 'users.view'],
        'users.view',
        true,
        PERMISSION_CATALOG,
      ),
    ).toEqual(['users.view', 'roles.view']);
  });

  it('descarta los códigos que no están en el catálogo', () => {
    expect(
      togglePermission(['legacy.view'], 'roles.view', true, PERMISSION_CATALOG),
    ).toEqual(['roles.view']);
  });
});

describe('grantsSummary', () => {
  it('resume por grupo con sus acciones en minúscula', () => {
    expect(
      grantsSummary(
        ['users.view', 'users.manage', 'roles.view'],
        PERMISSION_CATALOG,
      ),
    ).toEqual(['Usuarios: ver y gestionar', 'Roles y permisos: ver']);
  });

  it('une tres acciones con coma y "y"', () => {
    expect(
      grantsSummary(['quotes.view', 'quotes.edit', 'quotes.approve'], CHAIN),
    ).toEqual(['Cotizaciones: ver, editar y aprobar']);
  });

  it('sin permisos no resume nada', () => {
    expect(grantsSummary([], PERMISSION_CATALOG)).toEqual([]);
  });

  it('ignora los códigos que no están en el catálogo', () => {
    expect(grantsSummary(['legacy.view'], PERMISSION_CATALOG)).toEqual([]);
  });
});
