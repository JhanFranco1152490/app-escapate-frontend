import { describe, expect, it } from 'vitest';

import {
  loadLegalDocument,
  type LegalDocumentName,
} from './load-legal-document';

// Un dato por llenar se escribe entre corchetes y en mayúsculas, como [NIT].
const PLACEHOLDER = /\[[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ0-9 ]+\]/g;

describe.each<LegalDocumentName>(['privacidad', 'terminos'])(
  'documento legal %s',
  (name) => {
    it('carga y empieza con un título', async () => {
      const source = await loadLegalDocument(name);

      expect(source).toMatch(/^# \S/);
    });

    it('no tiene datos de la agencia por llenar', async () => {
      const source = await loadLegalDocument(name);

      expect(source.match(PLACEHOLDER) ?? []).toEqual([]);
    });
  },
);

describe('loadLegalDocument', () => {
  it('falla si el documento no existe', async () => {
    await expect(
      loadLegalDocument('inexistente' as LegalDocumentName),
    ).rejects.toThrow(/ENOENT/);
  });
});
