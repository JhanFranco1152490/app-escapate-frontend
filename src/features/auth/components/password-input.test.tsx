import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { PasswordInput } from './password-input';

function renderInForm() {
  render(
    <form aria-label="Ingreso" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="password">Contraseña</label>
      <PasswordInput id="password" autoComplete="current-password" />
    </form>,
  );
  return screen.getByLabelText('Contraseña');
}

describe('PasswordInput', () => {
  it('empieza oculta', () => {
    const input = renderInForm();

    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('autocomplete', 'current-password');
    expect(
      screen.getByRole('button', { name: 'Mostrar contraseña' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('alterna entre mostrar y ocultar', async () => {
    const user = userEvent.setup();
    const input = renderInForm();

    await user.click(
      screen.getByRole('button', { name: 'Mostrar contraseña' }),
    );

    expect(input).toHaveAttribute('type', 'text');
    const hide = screen.getByRole('button', { name: 'Ocultar contraseña' });
    expect(hide).toHaveAttribute('aria-pressed', 'true');

    await user.click(hide);

    expect(input).toHaveAttribute('type', 'password');
  });

  it('el botón no envía el formulario', () => {
    renderInForm();

    expect(
      screen.getByRole('button', { name: 'Mostrar contraseña' }),
    ).toHaveAttribute('type', 'button');
  });

  it('se vuelve a ocultar al enviar el formulario', async () => {
    const user = userEvent.setup();
    const input = renderInForm();
    await user.click(
      screen.getByRole('button', { name: 'Mostrar contraseña' }),
    );

    fireEvent.submit(screen.getByRole('form', { name: 'Ingreso' }));

    expect(input).toHaveAttribute('type', 'password');
    expect(
      screen.getByRole('button', { name: 'Mostrar contraseña' }),
    ).toBeInTheDocument();
  });

  it('entrega el campo a quien pasa la ref (react-hook-form lo usa para enfocar)', () => {
    const ref = createRef<HTMLInputElement>();
    render(<PasswordInput ref={ref} aria-label="Contraseña" />);

    expect(ref.current).toBe(screen.getByLabelText('Contraseña'));
  });
});
