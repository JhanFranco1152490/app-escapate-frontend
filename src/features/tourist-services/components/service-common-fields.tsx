import { FormField, fieldAriaProps } from '@/components/form-field';
import { Textarea } from '@/components/textarea';
import { Input } from '@/components/ui/input';

import type { ServiceFormApi } from '../schemas';
import { DESTINATION_LIST_ID } from './destination-datalist';

const DESTINATION_HINT =
  'En un vuelo, la ciudad de llegada; en un crucero o un paquete, la región o el destino principal.';
const CONDITIONS_PLACEHOLDER =
  'Cancelación sin costo hasta 30 días antes. Menores de 5 años no pagan.';

export function ServiceCommonFields({ form }: { form: ServiceFormApi }) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <>
      <div className="md:col-span-2">
        <FormField
          id="name"
          label="Nombre del servicio"
          required
          error={errors.name?.message}
        >
          <Input
            id="name"
            autoComplete="off"
            maxLength={150}
            placeholder="Habitación familiar conectada"
            className="h-11"
            {...register('name')}
            {...fieldAriaProps('name', { error: errors.name?.message })}
          />
        </FormField>
      </div>
      <div className="md:col-span-2">
        <FormField
          id="destination"
          label="Destino"
          required
          hint={DESTINATION_HINT}
          error={errors.destination?.message}
        >
          <Input
            id="destination"
            list={DESTINATION_LIST_ID}
            autoComplete="off"
            maxLength={120}
            className="h-11"
            {...register('destination')}
            {...fieldAriaProps('destination', {
              error: errors.destination?.message,
              hint: DESTINATION_HINT,
            })}
          />
        </FormField>
      </div>
      <div className="md:col-span-2">
        <FormField
          id="description"
          label="Descripción"
          error={errors.description?.message}
        >
          <Textarea
            id="description"
            maxLength={2000}
            {...register('description')}
            {...fieldAriaProps('description', {
              error: errors.description?.message,
            })}
          />
        </FormField>
      </div>
      <div className="md:col-span-2">
        <FormField
          id="conditions"
          label="Condiciones y política de cancelación"
          error={errors.conditions?.message}
        >
          <Textarea
            id="conditions"
            maxLength={2000}
            placeholder={CONDITIONS_PLACEHOLDER}
            {...register('conditions')}
            {...fieldAriaProps('conditions', {
              error: errors.conditions?.message,
            })}
          />
        </FormField>
      </div>
    </>
  );
}
