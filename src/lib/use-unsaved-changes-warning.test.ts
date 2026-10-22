import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useUnsavedChangesWarning } from './use-unsaved-changes-warning';

// Lo que el navegador hace al cerrar o recargar la pestaña: si alguien cancela el evento,
// pregunta antes de salir.
function leavePage() {
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

describe('useUnsavedChangesWarning', () => {
  it('con cambios sin guardar, el navegador pregunta antes de salir', () => {
    renderHook(() => useUnsavedChangesWarning(true));

    expect(leavePage()).toBe(true);
  });

  it('sin cambios no pregunta', () => {
    renderHook(() => useUnsavedChangesWarning(false));

    expect(leavePage()).toBe(false);
  });

  it('después de guardar deja de preguntar', () => {
    const { rerender } = renderHook(
      ({ dirty }) => useUnsavedChangesWarning(dirty),
      { initialProps: { dirty: true } },
    );

    rerender({ dirty: false });

    expect(leavePage()).toBe(false);
  });

  it('al salir de la pantalla deja de preguntar', () => {
    const { unmount } = renderHook(() => useUnsavedChangesWarning(true));

    unmount();

    expect(leavePage()).toBe(false);
  });
});
