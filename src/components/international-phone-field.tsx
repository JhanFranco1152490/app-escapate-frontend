import {
  get,
  type FieldValues,
  type Path,
  type PathValue,
  type UseFormReturn,
} from 'react-hook-form';

import { FormField, fieldAriaProps } from '@/components/form-field';
import { PhoneCountryOptions } from '@/components/phone-country-options';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { phoneCountryOf, toE164, type PhoneCountry } from '@/lib/format/phone';

type PhoneFormApi<T extends FieldValues> = Pick<
  UseFormReturn<T>,
  'register' | 'setValue' | 'getValues' | 'formState'
>;

type InternationalPhoneFieldProps<T extends FieldValues> = {
  form: PhoneFormApi<T>;
  // Los campos del formulario donde viven el número y su país: cada formulario los nombra como
  // los nombra la API.
  names: { number: Path<T>; country: Path<T> };
  label?: string;
  required?: boolean;
  // Al salir del número o cambiar el país: el teléfono en E.164, o null si no es válido.
  onCommit?: (e164: string | null) => void;
};

// País e indicativo por separado del número: la persona elige el país (Colombia por defecto)
// y escribe el número como lo dicta la otra persona. Si lo pega con su indicativo (+58 …), el
// selector pasa solo a ese país.
export function InternationalPhoneField<T extends FieldValues>({
  form: {
    register,
    setValue,
    getValues,
    formState: { errors },
  },
  names,
  label = 'Teléfono',
  required,
  onCommit,
}: InternationalPhoneFieldProps<T>) {
  const id = names.number;
  const error = get(errors, id)?.message as string | undefined;
  const commit = () => {
    const [number, country] = getValues([names.number, names.country]);
    onCommit?.(toE164(number, country as PhoneCountry));
  };
  const phone = register(names.number, {
    onChange: (event: { target: { value: string } }) => {
      const country = phoneCountryOf(event.target.value);
      if (country) {
        setValue(names.country, country as PathValue<T, Path<T>>);
      }
    },
    onBlur: commit,
  });

  return (
    <FormField id={id} label={label} required={required} error={error}>
      <div className="flex gap-2">
        <NativeSelect
          aria-label={`País del ${label.toLowerCase()}`}
          className="w-36 shrink-0 [&_select]:h-11"
          {...register(names.country, { onChange: commit })}
        >
          <PhoneCountryOptions />
        </NativeSelect>
        <Input
          id={id}
          type="tel"
          inputMode="tel"
          // Es el teléfono de otra persona: el navegador no debe proponer el propio.
          autoComplete="off"
          className="h-11"
          {...phone}
          {...fieldAriaProps(id, { error })}
        />
      </div>
    </FormField>
  );
}
