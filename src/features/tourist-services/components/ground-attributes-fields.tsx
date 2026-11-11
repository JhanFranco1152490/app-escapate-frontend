import type { ServiceFormApi } from '../schemas';
import { MODALITY_LABELS, VEHICLE_KIND_LABELS } from '../service-options';
import { AttributeInput } from './attribute-input';
import { AttributeSelect } from './attribute-select';

export function GroundAttributesFields({ form }: { form: ServiceFormApi }) {
  return (
    <>
      <AttributeSelect
        form={form}
        name="modality"
        label="Modalidad"
        labels={MODALITY_LABELS}
        required
      />
      <AttributeSelect
        form={form}
        name="vehicle_kind"
        label="Vehículo"
        labels={VEHICLE_KIND_LABELS}
      />
      <AttributeInput
        form={form}
        name="origin"
        label="Origen"
        placeholder="Aeropuerto Rafael Núñez"
        maxLength={120}
      />
      <AttributeInput
        form={form}
        name="max_capacity"
        label="Capacidad máxima"
        hint="Personas por vehículo, de 1 a 60."
        kind="integer"
      />
    </>
  );
}
