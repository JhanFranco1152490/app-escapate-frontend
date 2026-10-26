import { memo } from 'react';

import { NativeSelectOption } from '@/components/ui/native-select';
import { countryOptions } from '@/lib/countries';

// Son más de 240 opciones que nunca cambian: se arman una sola vez y no se vuelven a dibujar
// cada vez que el formulario cambia.
const OPTIONS = countryOptions();

export const NationalityOptions = memo(function NationalityOptions() {
  return OPTIONS.map((option) => (
    <NativeSelectOption key={option.code} value={option.code}>
      {option.name}
    </NativeSelectOption>
  ));
});
