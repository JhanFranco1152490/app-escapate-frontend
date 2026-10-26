import type { UseFormRegisterReturn } from 'react-hook-form';

import { FormField, fieldAriaProps } from '@/components/form-field';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { useRoles } from '@/features/roles/api';

type RoleFieldProps =
  | { mode: 'create'; field: UseFormRegisterReturn<'role_id'>; error?: string }
  | { mode: 'edit'; roleName: string };

const EDIT_HINT = 'El rol se cambia desde la asignación de roles.';

// Al crear se elige entre los roles que existen; al editar solo se muestra, porque cambiar el
// rol tiene reglas propias y se hace en otra pantalla.
export function RoleField(props: RoleFieldProps) {
  const roles = useRoles({ enabled: props.mode === 'create' });

  if (props.mode === 'edit') {
    return (
      <FormField id="role" label="Rol" hint={EDIT_HINT}>
        <Input
          id="role"
          readOnly
          value={props.roleName}
          className="h-11"
          {...fieldAriaProps('role', { hint: EDIT_HINT })}
        />
      </FormField>
    );
  }

  return (
    <FormField id="role_id" label="Rol" required error={props.error}>
      <NativeSelect
        id="role_id"
        className="w-full [&_select]:h-11"
        {...props.field}
        {...fieldAriaProps('role_id', { error: props.error })}
      >
        <NativeSelectOption value="">Selecciona un rol</NativeSelectOption>
        {roles.data?.map((role) => (
          <NativeSelectOption key={role.id} value={role.id}>
            {role.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {/* Sin roles no hay qué elegir: se dice por qué en vez de dejar el selector vacío. */}
      {roles.isError && (
        <p className="text-[0.78125rem] text-destructive">
          No pudimos cargar los roles.{' '}
          <button
            type="button"
            className="min-h-11 underline underline-offset-4"
            onClick={() => void roles.refetch()}
          >
            Reintentar
          </button>
        </p>
      )}
    </FormField>
  );
}
