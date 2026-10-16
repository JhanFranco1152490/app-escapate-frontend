import type { DocumentValues } from './schemas';

// Vive en memoria del módulo a propósito: pasa el documento del login a la pantalla de
// recuperación en una navegación del lado del cliente y se pierde al recargar. Así el
// documento no queda en la URL (que va al historial) ni en el almacenamiento del navegador.
let prefill: DocumentValues | undefined;

export const setResetPrefill = (values: DocumentValues) => {
  prefill = values;
};

export const readResetPrefill = () => prefill;

export const clearResetPrefill = () => {
  prefill = undefined;
};
