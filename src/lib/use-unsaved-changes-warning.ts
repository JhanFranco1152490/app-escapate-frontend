import { useEffect } from 'react';

// Con cambios sin guardar, el navegador pregunta antes de cerrar o recargar la pestaña. La
// navegación dentro del panel no pasa por aquí: el router de Next.js no ofrece una forma
// soportada de interceptarla.
export function useUnsavedChangesWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
}
