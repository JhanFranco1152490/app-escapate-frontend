import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/errors';

import { GENERIC_LOGIN_NOTICE, loginNoticeFromError } from '../login-errors';
import type { LoginValues } from '../schemas';
import { DocumentLoginForm } from './document-login-form';

const apiError = (
  status: number,
  code: string,
  fields: Record<string, string[]> = {},
) => new ApiError(status, { detail: 'Detalle del API', code, fields });

function setup(onSubmit = vi.fn<(values: LoginValues) => Promise<unknown>>()) {
  const onNotice = vi.fn();
  render(<DocumentLoginForm onSubmit={onSubmit} onNotice={onNotice} />);
  const fields = {
    type: screen.getByLabelText(/Tipo de documento/),
    number: screen.getByLabelText(/Número de documento/),
    password: screen.getByLabelText(/^Contraseña/),
  };
  return { user: userEvent.setup(), onSubmit, onNotice, fields };
}

async function fillAndSubmit(
  { user, fields }: ReturnType<typeof setup>,
  number = '1090123456',
) {
  await user.type(fields.number, number);
  await user.type(fields.password, 'una-clave-de-prueba');
  await user.click(screen.getByRole('button', { name: 'Entrar' }));
}

describe('DocumentLoginForm', () => {
  it('trae los cuatro tipos de documento con CC preseleccionado', () => {
    const { fields } = setup();

    expect(fields.type).toHaveValue('CC');
    expect(
      screen.getAllByRole('option').map((option) => option.textContent),
    ).toEqual([
      'Cédula de ciudadanía',
      'Cédula de extranjería',
      'Permiso por protección temporal',
      'Pasaporte',
    ]);
  });

  it('con campos vacíos muestra los mensajes y no envía', async () => {
    const { user, onSubmit, fields } = setup();

    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(fields.number).toHaveAccessibleDescription(
      'Ingresa tu número de documento.',
    );
    expect(fields.number).toHaveAttribute('aria-invalid', 'true');
    expect(fields.password).toHaveAccessibleDescription(
      'Ingresa tu contraseña.',
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envía el tipo elegido y el número sin espacios en los extremos', async () => {
    const ctx = setup(vi.fn().mockResolvedValue(undefined));
    await ctx.user.selectOptions(ctx.fields.type, 'PA');

    await fillAndSubmit(ctx, '  AB12345 ');

    expect(ctx.onSubmit).toHaveBeenCalledWith({
      document_type: 'PA',
      document_number: 'AB12345',
      password: 'una-clave-de-prueba',
    });
  });

  it('usa teclado numérico solo con la cédula de ciudadanía', async () => {
    const { user, fields } = setup();

    expect(fields.number).toHaveAttribute('inputmode', 'numeric');
    await user.selectOptions(fields.type, 'PA');
    expect(fields.number).toHaveAttribute('inputmode', 'text');
  });

  it('deshabilita el botón mientras envía', async () => {
    let finish!: () => void;
    const ctx = setup(
      vi.fn(() => new Promise<void>((resolve) => (finish = resolve))),
    );

    await fillAndSubmit(ctx);

    expect(screen.getByRole('button', { name: 'Entrando…' })).toBeDisabled();
    finish();
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeEnabled();
  });

  it('ante un error avisa, borra la contraseña y conserva el documento', async () => {
    const error = apiError(401, 'invalid_credentials');
    const ctx = setup(vi.fn().mockRejectedValue(error));
    await ctx.user.selectOptions(ctx.fields.type, 'CE');

    await fillAndSubmit(ctx, 'X12345');

    expect(ctx.onNotice).toHaveBeenLastCalledWith(loginNoticeFromError(error));
    expect(ctx.fields.password).toHaveValue('');
    expect(ctx.fields.password).toHaveFocus();
    expect(ctx.fields.type).toHaveValue('CE');
    expect(ctx.fields.number).toHaveValue('X12345');
  });

  it('pone los errores de validación del servidor en su campo', async () => {
    const ctx = setup(
      vi.fn().mockRejectedValue(
        apiError(422, 'validation_error', {
          document_number: ['Revisa el número.'],
        }),
      ),
    );

    await fillAndSubmit(ctx);

    expect(ctx.fields.number).toHaveAccessibleDescription('Revisa el número.');
    expect(ctx.fields.number).toHaveFocus();
    expect(ctx.onNotice).toHaveBeenLastCalledWith(undefined);
  });

  it('avisa en general si el servidor marca un campo que el formulario no tiene', async () => {
    const ctx = setup(
      vi
        .fn()
        .mockRejectedValue(
          apiError(422, 'validation_error', { extra: ['Campo no permitido.'] }),
        ),
    );

    await fillAndSubmit(ctx);

    expect(ctx.onNotice).toHaveBeenLastCalledWith(GENERIC_LOGIN_NOTICE);
  });
});
