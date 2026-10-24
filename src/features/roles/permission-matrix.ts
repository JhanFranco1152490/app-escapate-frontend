import type { PermissionItem } from './api';

export type MatrixGroup = { name: string; permissions: PermissionItem[] };
export type MatrixSection = { name: string; groups: MatrixGroup[] };

// Secciones y grupos en el orden en que aparecen en el catálogo: el backend decide el orden.
export function groupCatalog(catalog: readonly PermissionItem[]) {
  const sections: MatrixSection[] = [];
  for (const item of catalog) {
    let section = sections.find((existing) => existing.name === item.section);
    if (!section) {
      section = { name: item.section, groups: [] };
      sections.push(section);
    }
    const group = section.groups.find(
      (existing) => existing.name === item.group,
    );
    if (group) group.permissions.push(item);
    else section.groups.push({ name: item.group, permissions: [item] });
  }
  return sections;
}

// Al marcar, también lo que el permiso necesita; al desmarcar, también lo que depende de él.
// En los dos casos se siguen las dependencias en cadena.
export function togglePermission(
  selected: readonly string[],
  code: string,
  checked: boolean,
  catalog: readonly PermissionItem[],
) {
  const next = new Set(selected);
  const pending = [code];
  while (pending.length > 0) {
    const current = pending.pop()!;
    if (checked === next.has(current)) continue;
    if (checked) {
      next.add(current);
      const item = catalog.find((candidate) => candidate.code === current);
      pending.push(...(item?.requires ?? []));
    } else {
      next.delete(current);
      for (const item of catalog) {
        if (item.requires.includes(current)) pending.push(item.code);
      }
    }
  }
  // Solo los códigos del catálogo, en su orden: lo que se envía no depende del orden de los
  // clics.
  return catalog.filter((item) => next.has(item.code)).map((item) => item.code);
}

function joinActions(actions: string[]) {
  if (actions.length <= 1) return actions.join('');
  return `${actions.slice(0, -1).join(', ')} y ${actions.at(-1)}`;
}

// "Usuarios: ver y gestionar", un renglón por grupo autorizado.
export function grantsSummary(
  permissions: readonly string[],
  catalog: readonly PermissionItem[],
) {
  const granted = new Set(permissions);
  return groupCatalog(catalog.filter((item) => granted.has(item.code))).flatMap(
    (section) =>
      section.groups.map(
        (group) =>
          `${group.name}: ${joinActions(group.permissions.map((item) => item.label.toLowerCase()))}`,
      ),
  );
}
