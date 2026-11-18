type MineSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

// Interruptor "Mis solicitudes": solo las que tiene a cargo quien está en la sesión.
export function MineSwitch({ checked, onChange }: MineSwitchProps) {
  return (
    <label className="flex min-h-11 w-fit cursor-pointer items-center gap-2.5 text-sm">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-orange-500"
      />
      Mis solicitudes
    </label>
  );
}
