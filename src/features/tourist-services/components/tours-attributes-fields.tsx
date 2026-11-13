import type { ServiceFormApi } from '../schemas';
import {
  DURATION_UNIT_LABELS,
  MODALITY_LABELS,
  TOURS_INCLUDE_LABELS,
} from '../service-options';
import { AttributeInput } from './attribute-input';
import { AttributeSelect } from './attribute-select';
import { ChoiceCheckboxes } from './choice-checkboxes';

export function ToursAttributesFields({ form }: { form: ServiceFormApi }) {
  return (
    <>
      <AttributeInput
        form={form}
        name="duration_value"
        label="Duración"
        hint="De 1 a 999."
        kind="integer"
        required
      />
      <AttributeSelect
        form={form}
        name="duration_unit"
        label="Unidad de la duración"
        labels={DURATION_UNIT_LABELS}
        required
      />
      <AttributeSelect
        form={form}
        name="modality"
        label="Modalidad"
        labels={MODALITY_LABELS}
      />
      <AttributeInput
        form={form}
        name="meeting_point"
        label="Punto de encuentro"
        maxLength={200}
      />
      <ChoiceCheckboxes
        form={form}
        name="includes"
        legend="Incluye"
        labels={TOURS_INCLUDE_LABELS}
      />
    </>
  );
}
