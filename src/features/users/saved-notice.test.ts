import { describe, expect, it } from 'vitest';

import { setSavedNotice, takeSavedNotice } from './saved-notice';

describe('saved-notice', () => {
  it('se lee una sola vez', () => {
    setSavedNotice({ userId: 7, kind: 'created', invitationSent: true });

    expect(takeSavedNotice(7)).toEqual({
      userId: 7,
      kind: 'created',
      invitationSent: true,
    });
    expect(takeSavedNotice(7)).toBeUndefined();
  });

  it('no entrega el aviso de otro usuario, y lo descarta', () => {
    setSavedNotice({ userId: 7, kind: 'updated', invitationSent: null });

    expect(takeSavedNotice(8)).toBeUndefined();
    expect(takeSavedNotice(7)).toBeUndefined();
  });
});
