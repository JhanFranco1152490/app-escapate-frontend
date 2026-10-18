import { describe, expect, it } from 'vitest';

import {
  clearSavedNotice,
  readSavedNotice,
  setSavedNotice,
} from './saved-notice';

describe('saved-notice', () => {
  it('se lee hasta que se borra', () => {
    setSavedNotice({ userId: 7, kind: 'created', invitationSent: true });

    expect(readSavedNotice(7)).toEqual({
      userId: 7,
      kind: 'created',
      invitationSent: true,
    });
    expect(readSavedNotice(7)).toBeDefined();
    clearSavedNotice();
    expect(readSavedNotice(7)).toBeUndefined();
  });

  it('no entrega el aviso de otro usuario', () => {
    setSavedNotice({ userId: 7, kind: 'updated', invitationSent: null });

    expect(readSavedNotice(8)).toBeUndefined();
    clearSavedNotice();
  });
});
