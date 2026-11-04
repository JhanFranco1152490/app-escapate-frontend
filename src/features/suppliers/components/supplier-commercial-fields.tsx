import { FormField, fieldAriaProps } from '@/components/form-field';
import { Textarea } from '@/components/textarea';
import { Input } from '@/components/ui/input';

import type { SupplierFormApi } from '../schemas';

const NOTES_HINT = 'Visibles para todo el equipo.';
const COMMISSION_HINT =
  'Solo de referencia: no se usa para calcular cotizaciones.';

export function SupplierCommercialFields({ form }: { form: SupplierFormApi }) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <>
      <div className="md:col-span-2">
        <FormField
          id="payment_terms"
          label="Condiciones de pago"
          error={errors.payment_terms?.message}
        >
          <Input
            id="payment_terms"
            autoComplete="off"
            maxLength={500}
            placeholder="50 % al reservar, saldo 15 días antes"
            className="h-11"
            {...register('payment_terms')}
            {...fieldAriaProps('payment_terms', {
              error: errors.payment_terms?.message,
            })}
          />
        </FormField>
      </div>
      <FormField
        id="commission_rate"
        label="Comisión acordada (%)"
        hint={COMMISSION_HINT}
        error={errors.commission_rate?.message}
      >
        <Input
          id="commission_rate"
          inputMode="decimal"
          autoComplete="off"
          maxLength={6}
          className="h-11"
          {...register('commission_rate')}
          {...fieldAriaProps('commission_rate', {
            error: errors.commission_rate?.message,
            hint: COMMISSION_HINT,
          })}
        />
      </FormField>
      <FormField id="agreement_valid_until" label="Vigencia del convenio">
        <Input
          id="agreement_valid_until"
          type="date"
          className="h-11"
          {...register('agreement_valid_until')}
        />
      </FormField>
      <div className="md:col-span-2">
        <FormField
          id="notes"
          label="Notas"
          hint={NOTES_HINT}
          error={errors.notes?.message}
        >
          <Textarea
            id="notes"
            maxLength={2000}
            {...register('notes')}
            {...fieldAriaProps('notes', {
              error: errors.notes?.message,
              hint: NOTES_HINT,
            })}
          />
        </FormField>
      </div>
    </>
  );
}
