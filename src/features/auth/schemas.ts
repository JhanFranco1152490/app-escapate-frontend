import { z } from 'zod';

import type { DocumentType } from './api';

// El tipo exige una etiqueta por cada tipo de documento de la API y ninguna de más: si la
// API agrega o quita uno, esto deja de compilar. La lista del selector sale de aquí.
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CC: 'Cédula de ciudadanía',
  CE: 'Cédula de extranjería',
  PPT: 'Permiso por protección temporal',
  PA: 'Pasaporte',
};

export const DOCUMENT_TYPES = Object.keys(DOCUMENT_TYPE_LABELS) as [
  DocumentType,
  ...DocumentType[],
];

// Solo se exige que los campos vengan llenos: el formato del número lo revisa la API, que
// responde lo mismo ante un formato inválido que ante un documento inexistente.
export const documentSchema = z.object({
  document_type: z.enum(DOCUMENT_TYPES),
  document_number: z
    .string()
    .trim()
    .min(1, 'Ingresa tu número de documento.')
    .max(30, 'El número de documento es demasiado largo.'),
});

export type DocumentValues = z.infer<typeof documentSchema>;

export const loginSchema = documentSchema.extend({
  password: z
    .string()
    .min(1, 'Ingresa tu contraseña.')
    .max(256, 'La contraseña es demasiado larga.'),
});

export type LoginValues = z.infer<typeof loginSchema>;
