import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { StaleVersionNotice } from './stale-version-notice';

const MESSAGE =
  'Alguien más guardó cambios. Recarga para ver la versión actual.';

describe('StaleVersionNotice', () => {
  it('muestra el mensaje y recarga al pulsar el botón', async () => {
    const onReload = vi.fn();
    render(<StaleVersionNotice message={MESSAGE} onReload={onReload} />);

    expect(screen.getByRole('alert')).toHaveTextContent(MESSAGE);
    await userEvent.click(screen.getByRole('button', { name: 'Recargar' }));

    expect(onReload).toHaveBeenCalledOnce();
  });

  it('mientras recarga no deja pulsar otra vez', () => {
    render(
      <StaleVersionNotice message={MESSAGE} onReload={vi.fn()} reloading />,
    );

    expect(screen.getByRole('button', { name: 'Recargando…' })).toBeDisabled();
  });
});
