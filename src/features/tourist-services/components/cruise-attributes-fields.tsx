import type { ServiceFormApi } from '../schemas';
import { CABIN_KIND_LABELS, CRUISE_INCLUDE_LABELS } from '../service-options';
import { AttributeInput } from './attribute-input';
import { AttributeSelect } from './attribute-select';
import { ChoiceCheckboxes } from './choice-checkboxes';

export function CruiseAttributesFields({ form }: { form: ServiceFormApi }) {
  return (
    <>
      <AttributeInput
        form={form}
        name="ship_name"
        label="Barco"
        maxLength={120}
        required
      />
      <AttributeInput
        form={form}
        name="departure_port"
        label="Puerto de salida"
        maxLength={120}
        required
      />
      <AttributeInput
        form={form}
        name="nights"
        label="Noches"
        hint="De 1 a 60."
        kind="integer"
        required
      />
      <AttributeSelect
        form={form}
        name="cabin_kind"
        label="Tipo de cabina"
        labels={CABIN_KIND_LABELS}
      />
      <div className="md:col-span-2">
        <AttributeInput
          form={form}
          name="itinerary"
          label="Itinerario"
          placeholder="Miami, Cozumel, Roatán, Gran Caimán"
          maxLength={500}
        />
      </div>
      <ChoiceCheckboxes
        form={form}
        name="includes"
        legend="Incluye"
        labels={CRUISE_INCLUDE_LABELS}
      />
    </>
  );
}
