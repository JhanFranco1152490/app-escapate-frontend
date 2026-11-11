import type { ServiceFormApi } from '../schemas';
import { WHOLESALER_INCLUDE_LABELS } from '../service-options';
import { AttributeInput } from './attribute-input';
import { ChoiceCheckboxes } from './choice-checkboxes';

export function WholesalerAttributesFields({ form }: { form: ServiceFormApi }) {
  return (
    <>
      <AttributeInput
        form={form}
        name="nights"
        label="Noches"
        hint="0 si es un pasadía, hasta 60."
        kind="integer"
        required
      />
      <AttributeInput
        form={form}
        name="departure_city"
        label="Ciudad de salida"
        maxLength={120}
      />
      <ChoiceCheckboxes
        form={form}
        name="includes"
        legend="Incluye"
        labels={WHOLESALER_INCLUDE_LABELS}
      />
    </>
  );
}
