import { FormField, fieldAriaProps } from '@/components/form-field';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';

import type { AdvisorOption } from '../api';
import type { RequestFormApi } from '../schemas';

type AdvisorFieldProps = {
  form: RequestFormApi;
  advisors: AdvisorOption[] | undefined;
  // El responsable guardado, en la edición: puede que ya no esté entre las opciones.
  current?: { id: number; full_name: string };
};

const HINT = 'Quién atiende la solicitud. Cualquier asesor puede retomarla.';

// Las opciones son los usuarios activos que pueden gestionar solicitudes. Si el responsable
// guardado ya no es uno de ellos (se desactivó), se ve marcado para que se elija otro: el
// esquema no deja guardar con él.
export function AdvisorField({ form, advisors, current }: AdvisorFieldProps) {
  const {
    register,
    formState: { errors },
  } = form;
  const error = errors.assigned_to_id?.message;
  const missing =
    current && advisors && !advisors.some(({ id }) => id === current.id);

  return (
    <FormField
      id="assigned_to_id"
      label="Asesor responsable"
      required
      hint={HINT}
      error={error}
    >
      {/* Mientras cargan las opciones se muestra un selector aparte, sin registrar: el
          registrado se monta con las opciones ya puestas y así muestra el valor elegido (con
          el asesor aún sin opción, el navegador lo dejaría en blanco). */}
      {advisors ? (
        <NativeSelect
          id="assigned_to_id"
          className="w-full"
          {...register('assigned_to_id')}
          {...fieldAriaProps('assigned_to_id', { error, hint: HINT })}
        >
          <NativeSelectOption value="">Elige un asesor</NativeSelectOption>
          {missing && (
            <NativeSelectOption value={String(current.id)} disabled>
              {current.full_name} (inactivo)
            </NativeSelectOption>
          )}
          {advisors.map((advisor) => (
            <NativeSelectOption key={advisor.id} value={String(advisor.id)}>
              {advisor.full_name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      ) : (
        <NativeSelect id="assigned_to_id" className="w-full" disabled>
          <NativeSelectOption value="">Cargando asesores…</NativeSelectOption>
        </NativeSelect>
      )}
    </FormField>
  );
}
