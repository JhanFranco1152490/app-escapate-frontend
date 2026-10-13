import type { ReactNode } from 'react';

import { StatePanel } from './state-panel';

type ErrorStateProps = {
  title: string;
  children: ReactNode;
  action?: ReactNode;
};

export function ErrorState({ title, children, action }: ErrorStateProps) {
  return (
    <StatePanel
      illustration={<BrokenRouteIllustration />}
      title={title}
      action={action}
    >
      {children}
    </StatePanel>
  );
}

function BrokenRouteIllustration() {
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
      <g className="stroke-orange-500" strokeWidth="2" strokeDasharray="0.5 6">
        <path d="M10 62c12-12 22 6 32-4" />
        <path d="M56 54c8-7 17-1 28-11" />
      </g>
      <g className="fill-foreground" opacity="0.55">
        <circle cx="10" cy="62" r="3.2" />
        <circle cx="84" cy="43" r="3.2" />
      </g>
      <path
        d="M42 46l12 12M54 46 42 58"
        className="stroke-destructive"
        strokeWidth="2.4"
      />
      <circle
        cx="48"
        cy="52"
        r="15"
        className="stroke-destructive"
        strokeWidth="1.3"
        opacity="0.45"
      />
    </svg>
  );
}
