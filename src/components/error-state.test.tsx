import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ErrorState } from './error-state';

describe('ErrorState', () => {
  it('muestra el título, la explicación y la acción', () => {
    render(
      <ErrorState
        title="No pudimos cargar el panel"
        action={<button type="button">Reintentar</button>}
      >
        Se interrumpió la conexión.
      </ErrorState>,
    );

    expect(
      screen.getByRole('heading', { name: 'No pudimos cargar el panel' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Se interrumpió la conexión.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reintentar' }),
    ).toBeInTheDocument();
  });
});
