import { FormField, fieldAriaProps } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { phoneCountryOf, toE164, type PhoneCountry } from '@/lib/format/phone';

import type { ClientFormApi } from '../schemas';
import { PhoneCountryOptions } from './phone-country-options';

// País e indicativo por separado del número: la persona elige el país (Colombia por defecto)
// y escribe el número como lo dicta el cliente. Si lo pega con su indicativo (+58 …), el
// selector pasa solo a ese país.
export function ClientPhoneField({
  form: {
    register,
    setValue,
    getValues,
    formState: { errors },
  },
  onCommit,
}: {
  form: ClientFormApi;
  // Al salir del número o cambiar el país: el teléfono en E.164, o null si no es válido.
  onCommit?: (e164: string | null) => void;
}) {
  const error = errors.phone?.message;
  const commit = () => {
    const [number, country] = getValues(['phone', 'phone_country']);
    onCommit?.(toE164(number, country as PhoneCountry));
  };
  const phone = register('phone', {
    onChange: (event: { target: { value: string } }) => {
      const country = phoneCountryOf(event.target.value);
      if (country) setValue('phone_country', country);
    },
    onBlur: commit,
  });

  return (
    <FormField id="phone" label="Teléfono" required error={error}>
      <div className="flex gap-2">
        <NativeSelect
          aria-label="País del teléfono"
          className="w-36 shrink-0 [&_select]:h-11"
          {...register('phone_country', { onChange: commit })}
        >
          <PhoneCountryOptions />
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
