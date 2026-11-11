import type { ServiceFormApi } from '../schemas';
import { CABIN_CLASS_LABELS, TRIP_TYPE_LABELS } from '../service-options';
import { AttributeInput } from './attribute-input';
import { AttributeSelect } from './attribute-select';

// El destino del servicio es la ciudad de llegada; aquí va la de salida.
export function AirAttributesFields({ form }: { form: ServiceFormApi }) {
  return (
    <>
      <AttributeInput
        form={form}
        name="origin"
        label="Origen"
        placeholder="Bogotá (BOG)"
        maxLength={120}
        required
      />
      <AttributeSelect
        form={form}
        name="trip_type"
        label="Trayecto"
        labels={TRIP_TYPE_LABELS}
        required
      />
      <AttributeSelect
        form={form}
        name="cabin_class"
        label="Clase"
        labels={CABIN_CLASS_LABELS}
      />
      <AttributeInput
        form={form}
        name="stops"
        label="Escalas"
        hint="0 si es directo, hasta 3."
        kind="integer"
      />
      <AttributeInput
        form={form}
        name="checked_bags"
        label="Maletas en bodega"
        hint="De 0 a 5."
        kind="integer"
      />
      <label className="flex min-h-11 items-center gap-3 self-end text-[0.875rem]">
        <input
          type="checkbox"
          className="size-4 shrink-0 accent-orange-500"
          {...form.register('attributes.carry_on_included')}
        />
        Equipaje de mano incluido
      </label>
    </>
  );
}
