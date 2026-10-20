export type SavedNotice = {
  userId: number;
  kind: 'created' | 'updated';
  // null si no hizo falta enviar la invitación; false si se intentó y el correo falló.
  invitationSent: boolean | null;
};

// Vive en memoria del módulo a propósito: lleva el resultado del formulario a la ficha en una
// navegación del lado del cliente y se pierde al recargar, así "Usuario creado" no se repite
// cada vez que se vuelve a abrir la ficha.
let notice: SavedNotice | undefined;

export const setSavedNotice = (value: SavedNotice) => {
  notice = value;
};

// Leer y borrar van por separado: en desarrollo React ejecuta dos veces el estado inicial, y
// si la lectura borrara, la segunda ya no encontraría el aviso. La ficha lo lee al montar y
// lo borra en un efecto.
export const readSavedNotice = (userId: number) =>
  notice?.userId === userId ? notice : undefined;

export const clearSavedNotice = () => {
  notice = undefined;
};
