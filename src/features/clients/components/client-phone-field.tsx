import { useMemo } from 'react';

import { FormField, fieldAriaProps } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { phoneCountryOf, phoneCountryOptions } from '@/lib/format/phone';

import type { ClientFormApi } from '../schemas';

// País e indicativo por separado del número: la persona elige el país (Colombia por defecto)
// y escribe el número como lo dicta el cliente. Si lo pega con su indicativo (+58 …), el
// selector pasa solo a ese país.
export function ClientPhoneField({
  form: {
    register,
    setValue,
    formState: { errors },
  },
}: {
  form: ClientFormApi;
}) {
  const options = useMemo(() => phoneCountryOptions(), []);
  const error = errors.phone?.message;
  const phone = register('phone', {
    onChange: (event: { target: { value: string } }) => {
      const country = phoneCountryOf(event.target.value);
      if (country) setValue('phone_country', country);
    },
  });

  return (
    <FormField id="phone" label="Teléfono" required error={error}>
      <div className="flex gap-2">
        <NativeSelect
          aria-label="País del teléfono"
          className="w-36 shrink-0 [&_select]:h-11"
          {...register('phone_country')}
        >
          {options.map((option) => (
            <NativeSelectOption key={option.code} value={option.code}>
              {option.name} +{option.callingCode}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          // Es el teléfono de otra persona: el navegador no debe proponer el propio.
          autoComplete="off"
          className="h-11"
          {...phone}
          {...fieldAriaProps('phone', { error })}
        />
      </div>
    </FormField>
  );
}
