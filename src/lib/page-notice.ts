// A qué pantalla va el aviso: una clave con el dominio adelante ("role:3", "client:12",
// "roles"), para que el aviso de un rol no aparezca en la ficha del cliente con el mismo id.
type PageNotice = { target: string; text: string };

// Lleva el resultado de una acción ("Cliente registrado.") a la pantalla siguiente en una
// navegación del lado del cliente. Vive en memoria del módulo a propósito: se pierde al
// recargar, así el aviso no se repite cada vez que se vuelve a abrir la pantalla.
let notice: PageNotice | undefined;

export const setPageNotice = (value: PageNotice) => {
  notice = value;
};

// Leer y borrar van por separado: en desarrollo React ejecuta dos veces el estado inicial, y
// si la lectura borrara, la segunda ya no encontraría el aviso.
export const readPageNotice = (target: string) =>
  notice?.target === target ? notice.text : undefined;

export const clearPageNotice = () => {
  notice = undefined;
};
