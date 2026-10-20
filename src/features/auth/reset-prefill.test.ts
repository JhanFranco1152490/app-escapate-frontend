import { afterEach, describe, expect, it } from 'vitest';

import {
  clearResetPrefill,
  readResetPrefill,
  setResetPrefill,
} from './reset-prefill';

describe('reset-prefill', () => {
  afterEach(clearResetPrefill);

  it('sin nada guardado devuelve undefined', () => {
    expect(readResetPrefill()).toBeUndefined();
  });

  it('devuelve lo guardado hasta que se borra', () => {
    const document = { document_type: 'PA', document_number: 'AB123' } as const;

    setResetPrefill(document);

    expect(readResetPrefill()).toEqual(document);
    expect(readResetPrefill()).toEqual(document);
    clearResetPrefill();
    expect(readResetPrefill()).toBeUndefined();
  });
});
