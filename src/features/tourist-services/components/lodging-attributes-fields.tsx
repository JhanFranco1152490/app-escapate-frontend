import type { ServiceFormApi } from '../schemas';
import {
  LODGING_INCLUDE_LABELS,
  LODGING_KIND_LABELS,
  MEAL_PLAN_LABELS,
} from '../service-options';
import { AttributeInput } from './attribute-input';
import { AttributeSelect } from './attribute-select';
import { ChoiceCheckboxes } from './choice-checkboxes';

// Las comidas las dice el régimen: "Incluye" no las repite.
export function LodgingAttributesFields({ form }: { form: ServiceFormApi }) {
  return (
    <>
      <AttributeSelect
        form={form}
        name="lodging_kind"
        label="Tipo de alojamiento"
        labels={LODGING_KIND_LABELS}
        required
      />
      <AttributeInput
        form={form}
        name="max_capacity"
        label="Capacidad máxima"
        hint="Personas por habitación o unidad, de 1 a 50."
        kind="integer"
        required
      />
      <AttributeInput
        form={form}
        name="stars"
        label="Categoría (estrellas)"
        hint="De 1 a 5."
        kind="integer"
      />
      <AttributeSelect
        form={form}
        name="meal_plan"
        label="Régimen"
        labels={MEAL_PLAN_LABELS}
      />
      <AttributeInput
        form={form}
        name="check_in_time"
        label="Check-in"
        kind="time"
      />
      <AttributeInput
        form={form}
        name="check_out_time"
        label="Check-out"
        kind="time"
      />
      <ChoiceCheckboxes
        form={form}
        name="includes"
        legend="Incluye"
        labels={LODGING_INCLUDE_LABELS}
      />
    </>
  );
}
