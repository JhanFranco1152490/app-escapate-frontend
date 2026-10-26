import { afterEach, describe, expect, it } from 'vitest';

import { renderHookWithProviders } from '@/test/render';

import { clearPageNotice, readPageNotice, setPageNotice } from './page-notice';
import { usePageNotice } from './use-page-notice';

afterEach(() => {
  clearPageNotice();
});

describe('page-notice', () => {
  it('se lee hasta que se borra', () => {
    setPageNotice({ target: 'client:7', text: 'Cliente registrado.' });

    expect(readPageNotice('client:7')).toBe('Cliente registrado.');
    expect(readPageNotice('client:7')).toBe('Cliente registrado.');
    clearPageNotice();
    expect(readPageNotice('client:7')).toBeUndefined();
  });

  it('no entrega el aviso de otra pantalla', () => {
    setPageNotice({ target: 'client:7', text: 'Cliente registrado.' });

    expect(readPageNotice('traveler:7')).toBeUndefined();
  });
});

describe('usePageNotice', () => {
  it('entrega el aviso al montar y lo borra después', () => {
    setPageNotice({ target: 'client:7', text: 'Cambios guardados.' });

    const { result } = renderHookWithProviders(() => usePageNotice('client:7'));

    expect(result.current).toBe('Cambios guardados.');
    expect(readPageNotice('client:7')).toBeUndefined();
  });
});
