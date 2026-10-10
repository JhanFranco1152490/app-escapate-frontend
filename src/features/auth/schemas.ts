import { z } from 'zod';

export const DOCUMENT_TYPES = ['CC', 'CE', 'PPT', 'PA'] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  CC: 'Cédula de ciudadanía',
  CE: 'Cédula de extranjería',
  PPT: 'Permiso por protección temporal',
  PA: 'Pasaporte',
};

// Solo se exige que los campos vengan llenos: el formato del número lo revisa la API, que
// responde lo mismo ante un formato inválido que ante un documento inexistente.
export const loginSchema = z.object({
  document_type: z.enum(DOCUMENT_TYPES),
  document_number: z
    .string()
    .trim()
    .min(1, 'Ingresa tu número de documento.')
    .max(30, 'El número de documento es demasiado largo.'),
  password: z
    .string()
    .min(1, 'Ingresa tu contraseña.')
    .max(256, 'La contraseña es demasiado larga.'),
});

export type LoginValues = z.infer<typeof loginSchema>;
