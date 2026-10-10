import type { ReactNode } from 'react';

type ForbiddenStateProps = {
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
};

// Solo comodidad visual: la API responde 403 a quien no tiene el permiso, se vea o no
// esta pantalla.
export function ForbiddenState({
  title = 'No tienes acceso a esta sección',
  children = 'Pídele a un administrador de la agencia que te dé acceso si lo necesitas.',
  action,
}: ForbiddenStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4.5 rounded-xl border bg-card px-6 py-8 text-center sm:px-14">
      <LockIllustration />
      <div className="flex flex-col items-center gap-2.5">
        <h2 className="font-heading text-[1.4375rem] leading-tight font-semibold tracking-[-0.02em]">
          {title}
        </h2>
        <p className="max-w-100 text-[0.84375rem] leading-relaxed text-muted-foreground">
          {children}
        </p>
      </div>
      {action}
    </div>
  );
}

function LockIllustration() {
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
      <circle
        cx="48"
        cy="48"
        r="33"
        className="stroke-orange-500"
        strokeWidth="2"
        strokeDasharray="0.5 6"
      />
      <g className="stroke-foreground" strokeWidth="1.6" opacity="0.65">
        <rect x="33" y="46" width="30" height="23" rx="3.5" />
        <path d="M39 46v-6a9 9 0 0 1 18 0v6" />
      </g>
      <circle
        cx="48"
        cy="57"
        r="2.6"
        className="fill-foreground"
        opacity="0.65"
      />
    </svg>
  );
}
