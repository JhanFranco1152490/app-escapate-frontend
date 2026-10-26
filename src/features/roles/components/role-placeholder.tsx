// Lo que se ve a la derecha de la lista, en escritorio, mientras no hay un rol abierto. En
// celular no hace falta: la lista ocupa la pantalla. Entra con un movimiento suave una sola
// vez; con "reducir movimiento" activado en el equipo, aparece sin animación.
export function RolePlaceholder() {
  return (
    <div className="flex min-h-60 flex-col items-center justify-center gap-4 rounded-md border border-dashed p-8 text-center motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in motion-safe:slide-in-from-bottom-2 max-lg:hidden">
      <ShieldIllustration />
      <div className="flex flex-col gap-1.5">
        <p className="font-heading text-lg font-semibold">
          Elige un rol para ver sus permisos.
        </p>
        <p className="max-w-80 text-[0.84375rem] leading-relaxed text-muted-foreground">
          Cada rol decide qué partes del panel pueden usar las personas que lo
          tienen.
        </p>
      </div>
    </div>
  );
}

function ShieldIllustration() {
  return (
    <svg
      width="104"
      height="104"
      viewBox="0 0 96 96"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d="M48 14 74 24v20c0 17-11 30-26 36C33 74 22 61 22 44V24Z"
        className="stroke-foreground"
        strokeWidth="1.6"
        opacity="0.6"
      />
      <path
        d="m37 47 8 8 15-16"
        className="stroke-orange-500"
        strokeWidth="2.2"
      />
      <path
        d="M10 76c14 8 30 9 44 2s24-6 32 0"
        className="stroke-orange-500"
        strokeWidth="2"
        strokeDasharray="0.5 6"
      />
    </svg>
  );
}
