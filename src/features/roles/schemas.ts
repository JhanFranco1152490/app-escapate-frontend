import { z } from 'zod';

import { optionalText, requiredText } from '@/lib/validation/text';

// Mismos límites que la API. Que cada permiso exista, traiga sus dependencias y no repita el
// conjunto de otro rol lo revisa la API: necesita el registro y los demás roles.
const ROLE_NAME_MAX_LENGTH = 80;
const ROLE_DESCRIPTION_MAX_LENGTH = 200;

export const roleFormSchema = z.object({
  name: requiredText(ROLE_NAME_MAX_LENGTH),
  description: optionalText(ROLE_DESCRIPTION_MAX_LENGTH),
  permissions: z.array(z.string()),
});

export type RoleFormValues = z.input<typeof roleFormSchema>;
export type RoleValues = z.output<typeof roleFormSchema>;
