import { z } from 'zod';

import { optionalText } from '@/lib/validation/text';

import type { CloseReason } from './api';
import { CLOSE_REASONS } from './labels';

const REASON_REQUIRED = 'Elige el motivo.';
// Mismo mensaje que la API.
const NOTE_REQUIRED = 'Cuéntanos el motivo.';

const note = optionalText(300);

export const closeFormSchema = z
  // Sin ningún motivo marcado, el formulario da null.
  .object({ reason: z.string().nullable(), note: z.string() })
  .superRefine((values, ctx) => {
    if (!CLOSE_REASONS.includes(values.reason as CloseReason)) {
      ctx.addIssue({
        code: 'custom',
        path: ['reason'],
        message: REASON_REQUIRED,
      });
      return;
    }
    const noteError = note.safeParse(values.note).error?.issues[0]?.message;
    const missingNote = values.reason === 'other' && !values.note.trim();
    if (noteError || missingNote) {
      ctx.addIssue({
        code: 'custom',
        path: ['note'],
        message: noteError ?? NOTE_REQUIRED,
      });
    }
  })
  .transform((values) => ({
    reason: values.reason as CloseReason,
    note: note.parse(values.note),
  }));

export type CloseFormValues = z.input<typeof closeFormSchema>;
export type ClosePayload = z.output<typeof closeFormSchema>;
