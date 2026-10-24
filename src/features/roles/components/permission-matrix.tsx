import { Alert } from '@/components/alert';

import type { PermissionItem } from '../api';
import { groupCatalog, togglePermission } from '../permission-matrix';

type PermissionMatrixProps = {
  catalog: PermissionItem[];
  value: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
  error?: string;
};

const helpId = (code: string) => `permission-${code}-help`;

// Una fila por grupo del catálogo y una casilla por cada permiso que el grupo registró: los
// textos vienen del backend, así un dominio nuevo aparece sin tocar esta pantalla.
export function PermissionMatrix({
  catalog,
  value,
  onChange,
  disabled,
  error,
}: PermissionMatrixProps) {
  const selected = new Set(value);

  return (
    <section
      aria-label="Permisos"
      className="flex flex-col gap-4 rounded-md border bg-card"
    >
      <header className="border-b px-5 py-4">
        <h2 className="font-heading text-lg font-semibold">Permisos</h2>
      </header>
      {error && (
        <div className="px-5">
          <Alert title={error} />
        </div>
      )}
      {groupCatalog(catalog).map((section) => (
        <div key={section.name} className="flex flex-col">
          <h3 className="px-5 pb-2 font-mono text-[0.625rem] tracking-[0.16em] text-muted-foreground uppercase">
            {section.name}
          </h3>
          {section.groups.map((group) => (
            <fieldset
              key={group.name}
              className="grid gap-3 border-t px-5 py-4 md:grid-cols-[200px_minmax(0,1fr)]"
            >
              <legend className="float-left font-semibold md:pt-2.5">
                {group.name}
              </legend>
              <div className="flex flex-col gap-3">
                {group.permissions.map((item) => (
                  <div key={item.code} className="flex flex-col gap-1">
                    <label className="flex min-h-11 w-fit items-center gap-2.5 text-[0.875rem]">
                      <input
                        type="checkbox"
                        className="size-4 accent-orange-500"
                        aria-label={`${group.name}: ${item.label.toLowerCase()}`}
                        aria-describedby={
                          item.help ? helpId(item.code) : undefined
                        }
                        checked={selected.has(item.code)}
                        disabled={disabled}
                        onChange={(event) =>
                          onChange(
                            togglePermission(
                              value,
                              item.code,
                              event.target.checked,
                              catalog,
                            ),
                          )
                        }
                      />
                      {item.label}
                    </label>
                    {item.help && (
                      <p
                        id={helpId(item.code)}
                        className="max-w-xl text-[0.78125rem] leading-normal text-muted-foreground"
                      >
                        {item.help}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      ))}
    </section>
  );
}
