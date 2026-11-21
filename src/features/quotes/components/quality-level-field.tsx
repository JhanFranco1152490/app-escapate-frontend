import { FormField } from '@/components/form-field';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';

import { QUALITY_LEVEL_LABELS, QUALITY_LEVELS } from '../quality-levels';
import type { ItemFormApi } from '../schemas';

// Opcional: sirve para comparar alternativas del mismo servicio por su nivel.
export function QualityLevelField({ form }: { form: ItemFormApi }) {
  return (
    <FormField
      id="item-quality-level"
      label="Nivel de calidad"
      hint="Para comparar opciones del mismo servicio."
      error={form.formState.errors.quality_level?.message}
    >
      <NativeSelect
        id="item-quality-level"
        className="w-full"
        {...form.register('quality_level')}
      >
        <NativeSelectOption value="">Sin nivel</NativeSelectOption>
        {QUALITY_LEVELS.map((level) => (
          <NativeSelectOption key={level} value={level}>
            {QUALITY_LEVEL_LABELS[level]}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </FormField>
  );
}
