import type { ReactNode } from 'react';

import { StatePanel } from './state-panel';

type EmptyStateProps = {
  title: string;
  children: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <StatePanel
      illustration={<NoResultsIllustration />}
      title={title}
      action={action}
    >
      {children}
    </StatePanel>
  );
}

function NoResultsIllustration() {
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
      <g className="stroke-foreground" strokeWidth="1.6" opacity="0.6">
        <circle cx="42" cy="42" r="21" />
        <path d="M57.5 57.5 76 76" />
      </g>
      <path
        d="M14 72c16 10 40 6 54-8"
        className="stroke-orange-500"
        strokeWidth="2"
        strokeDasharray="0.5 6"
      />
      <path
        d="M34 42h16M42 34v16"
        className="stroke-orange-500"
        strokeWidth="1.8"
        opacity="0.5"
        transform="rotate(45 42 42)"
      />
    </svg>
  );
}
