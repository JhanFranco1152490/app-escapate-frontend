import type { ReactNode } from 'react';

import { StatePanel } from './state-panel';

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
    <StatePanel
      illustration={<LockIllustration />}
      title={title}
      action={action}
    >
      {children}
    </StatePanel>
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
