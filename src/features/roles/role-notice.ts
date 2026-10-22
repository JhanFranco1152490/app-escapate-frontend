type RoleNotice = { roleId: number; text: string };

// Lleva "Rol creado." del formulario a la página del rol en una navegación del lado del
// cliente. Vive en memoria del módulo a propósito: se pierde al recargar, así el aviso no se
// repite cada vez que se vuelve a abrir el rol.
let notice: RoleNotice | undefined;

export const setRoleNotice = (value: RoleNotice) => {
  notice = value;
};

// Leer y borrar van por separado: en desarrollo React ejecuta dos veces el estado inicial, y
// si la lectura borrara, la segunda ya no encontraría el aviso.
export const readRoleNotice = (roleId: number) =>
  notice?.roleId === roleId ? notice.text : undefined;

export const clearRoleNotice = () => {
  notice = undefined;
};
