import type { ServiceFormApi } from '../schemas';
import { MEAL_LABELS, SERVICE_STYLE_LABELS } from '../service-options';
import { AttributeInput } from './attribute-input';
import { AttributeSelect } from './attribute-select';
import { ChoiceCheckboxes } from './choice-checkboxes';

export function FoodAttributesFields({ form }: { form: ServiceFormApi }) {
  return (
    <>
      <ChoiceCheckboxes
        form={form}
        name="meals"
        legend="Comidas"
        labels={MEAL_LABELS}
        required
      />
      <AttributeSelect
        form={form}
        name="service_style"
        label="Servicio"
        labels={SERVICE_STYLE_LABELS}
      />
      <AttributeInput
        form={form}
        name="cuisine"
        label="Tipo de cocina"
        maxLength={80}
      />
    </>
  );
}
