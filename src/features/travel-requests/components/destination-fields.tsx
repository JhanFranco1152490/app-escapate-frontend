import { CITY_LIST_ID, CityDatalist } from '@/components/city-datalist';
import { FormField, fieldAriaProps } from '@/components/form-field';
import { Input } from '@/components/ui/input';

import type { RequestFormApi } from '../schemas';

const DESTINATION_HINT = 'Uno o varios: "Cartagena y Santa Marta".';

export function DestinationFields({
  form: {
    register,
    formState: { errors },
  },
}: {
  form: RequestFormApi;
}) {
  const destinationError = errors.destination?.message;
  const originError = errors.origin?.message;
  return (
    <>
      <FormField
        id="destination"
        label="Destino"
        required
        hint={DESTINATION_HINT}
        error={destinationError}
      >
        <Input
          id="destination"
          autoComplete="off"
          maxLength={150}
          placeholder="San Andrés"
          className="h-11"
          {...register('destination')}
          {...fieldAriaProps('destination', {
            error: destinationError,
            hint: DESTINATION_HINT,
          })}
        />
      </FormField>
      <FormField id="origin" label="Origen" error={originError}>
        {/* La mayoría de los clientes sale de Cúcuta: se sugiere, pero no se llena solo. */}
        <Input
          id="origin"
          autoComplete="off"
          maxLength={120}
          placeholder="Cúcuta"
          list={CITY_LIST_ID}
          className="h-11"
          {...register('origin')}
          {...fieldAriaProps('origin', { error: originError })}
        />
        <CityDatalist />
      </FormField>
    </>
  );
}
