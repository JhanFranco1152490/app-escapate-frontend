import { readFile } from 'node:fs/promises';
import path from 'node:path';

export type LegalDocumentName = 'privacidad' | 'terminos';

// Solo corre en el servidor, en el build: las páginas legales se generan estáticas.
export function loadLegalDocument(name: LegalDocumentName): Promise<string> {
  return readFile(
    path.join(process.cwd(), 'src', 'content', 'legal', `${name}.md`),
    'utf8',
  );
}
