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

// Lo entrega una sola vez y solo a la ficha del mismo usuario; en cualquier caso lo borra.
export function takeSavedNotice(userId: number) {
  const current = notice;
  notice = undefined;
  return current?.userId === userId ? current : undefined;
}
