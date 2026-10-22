// A dónde va el aviso: la página de un rol ("Rol creado.") o la lista ("Rol borrado.").
type NoticeTarget = number | 'list';
type RoleNotice = { target: NoticeTarget; text: string };

// Lleva el resultado de una acción a la pantalla siguiente en una navegación del lado del
// cliente. Vive en memoria del módulo a propósito: se pierde al recargar, así el aviso no se
// repite cada vez que se vuelve a abrir la pantalla.
let notice: RoleNotice | undefined;

export const setRoleNotice = (value: RoleNotice) => {
  notice = value;
};

// Leer y borrar van por separado: en desarrollo React ejecuta dos veces el estado inicial, y
// si la lectura borrara, la segunda ya no encontraría el aviso.
export const readRoleNotice = (target: NoticeTarget) =>
  notice?.target === target ? notice.text : undefined;

export const clearRoleNotice = () => {
  notice = undefined;
};
