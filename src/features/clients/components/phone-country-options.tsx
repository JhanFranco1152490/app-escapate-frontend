import { memo } from 'react';

import { NativeSelectOption } from '@/components/ui/native-select';
import { phoneCountryOptions } from '@/lib/format/phone';

// Son más de 240 opciones que nunca cambian: se arman una sola vez y no se vuelven a dibujar
// cada vez que el formulario cambia.
const OPTIONS = phoneCountryOptions();

export const PhoneCountryOptions = memo(function PhoneCountryOptions() {
  return OPTIONS.map((option) => (
    <NativeSelectOption key={option.code} value={option.code}>
      {option.name} +{option.callingCode}
    </NativeSelectOption>
  ));
});
