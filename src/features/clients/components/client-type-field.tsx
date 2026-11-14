import { SegmentedChoice } from '@/components/segmented-choice';

import type { ClientType } from '../api';
import { CLIENT_TYPE_LABELS } from '../labels';

const OPTIONS = (Object.keys(CLIENT_TYPE_LABELS) as ClientType[]).map(
  (type) => ({ value: type, label: CLIENT_TYPE_LABELS[type] }),
);

type ClientTypeFieldProps = {
  value: ClientType;
  onChange: (value: ClientType) => void;
  // En la edición el tipo se muestra pero no se puede cambiar.
  disabled?: boolean;
};

// Primera decisión del formulario: cambia qué campos se piden.
export function ClientTypeField({
  value,
  onChange,
  disabled = false,
}: ClientTypeFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <SegmentedChoice
        legend="Tipo de cliente"
        name="client_type"
        options={OPTIONS}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      {disabled && (
        <p className="text-[0.78125rem] text-muted-foreground">
          El tipo de cliente no se puede cambiar. Si se registró mal, registra
          el cliente de nuevo.
        </p>
      )}
    </div>
  );
}
