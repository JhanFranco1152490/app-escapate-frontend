import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DEMO_ACCOUNTS } from '../demo-accounts';
import { DemoAccountsMenu } from './demo-accounts-menu';

async function openMenu() {
  const onSelect = vi.fn();
  const user = userEvent.setup();
  render(<DemoAccountsMenu onSelect={onSelect} />);
  await user.click(
    screen.getByRole('button', { name: /cuenta de demostración/i }),
  );
  await screen.findAllByRole('menuitem');
  return { user, onSelect };
}

describe('DemoAccountsMenu', () => {
  it('ofrece una opción por rol sembrado', async () => {
    await openMenu();

    const items = screen.getAllByRole('menuitem');
    expect(items).toHaveLength(DEMO_ACCOUNTS.length);
    DEMO_ACCOUNTS.forEach((account, index) =>
      expect(items[index]).toHaveTextContent(account.role),
    );
  });

  it('al elegir una cuenta entrega su documento y su contraseña', async () => {
    const { user, onSelect } = await openMenu();

    await user.click(
      screen.getByRole('menuitem', { name: /Asesor comercial/ }),
    );

    const advisor = DEMO_ACCOUNTS.find(
      (account) => account.role === 'Asesor comercial',
    )!;
    expect(onSelect).toHaveBeenCalledExactlyOnceWith({
      document_type: advisor.document_type,
      document_number: advisor.document_number,
      password: advisor.password,
    });
  });

  it('no muestra las contraseñas en el menú', async () => {
    await openMenu();

    for (const account of DEMO_ACCOUNTS) {
      expect(screen.queryByText(account.password)).not.toBeInTheDocument();
    }
  });

  it('desactivado no se puede abrir', async () => {
    const user = userEvent.setup();
    render(<DemoAccountsMenu onSelect={vi.fn()} disabled />);

    await user.click(
      screen.getByRole('button', { name: /cuenta de demostración/i }),
    );

    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });
});
