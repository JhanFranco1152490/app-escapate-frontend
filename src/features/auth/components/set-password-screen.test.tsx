import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { queryKeys } from '@/lib/api/query-keys';
import { apiUrl } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import type { ResetTokenInfo } from '../api';
import { SetPasswordScreen } from './set-password-screen';

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const TOKEN = 'abc.def-ghi';
const NEW_PASSWORD = 'una frase larga de prueba';
const EXPIRED = 'Este enlace no es válido o ya venció.';
const RESET_INFO: ResetTokenInfo = {
  purpose: 'reset',
  full_name: 'Persona de Prueba',
};

const invalidToken = () =>
  HttpResponse.json(
    {
      detail: 'El enlace no es válido o ya venció.',
      code: 'invalid_reset_token',
      fields: {},
    },
    { status: 400 },
  );

function openLink(path: string, token: string | null = TOKEN) {
  window.history.replaceState(
    null,
    '',
    token ? `${path}#token=${token}` : path,
  );
}

function respondToCheck(respond: () => Response) {
  const tokens: unknown[] = [];
  server.use(
    http.post(apiUrl('/api/auth/password-reset/check'), async ({ request }) => {
      tokens.push(await request.json());
      return respond();
    }),
  );
  return tokens;
}

function respondToConfirm(respond: () => Response) {
  const bodies: unknown[] = [];
  server.use(
    http.post(
      apiUrl('/api/auth/password-reset/confirm'),
      async ({ request }) => {
        bodies.push(await request.json());
        return respond();
      },
    ),
  );
  return bodies;
}

async function fillPasswords(password: string, confirmation = password) {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText(/^Nueva contraseña/), password);
  await user.type(screen.getByLabelText(/^Confirmar contraseña/), confirmation);
  return user;
}

beforeEach(() => router.replace.mockReset());
afterEach(() => window.history.replaceState(null, '', '/'));

describe('SetPasswordScreen (recuperación)', () => {
  it('sin token muestra el enlace vencido sin llamar a la API', async () => {
    openLink('/restablecer-contrasena', null);
    const tokens = respondToCheck(() => HttpResponse.json(RESET_INFO));

    renderWithProviders(<SetPasswordScreen linkPurpose="reset" />);

    expect(await screen.findByText(EXPIRED)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Pedir un enlace nuevo' }),
    ).toHaveAttribute('href', '/recuperar-contrasena');
    expect(tokens).toHaveLength(0);
  });

  it('con un token inválido muestra el enlace vencido', async () => {
    openLink('/restablecer-contrasena');
    respondToCheck(invalidToken);

    renderWithProviders(<SetPasswordScreen linkPurpose="reset" />);

    expect(await screen.findByText(EXPIRED)).toBeInTheDocument();
  });

  it('comprueba el token, lo quita de la URL y muestra el formulario', async () => {
    openLink('/restablecer-contrasena');
    const tokens = respondToCheck(() => HttpResponse.json(RESET_INFO));

    renderWithProviders(<SetPasswordScreen linkPurpose="reset" />);

    expect(
      await screen.findByRole('button', { name: 'Guardar contraseña' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Restablecer contraseña' }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/^Nueva contraseña/),
    ).toHaveAccessibleDescription(
      'Mínimo 12 caracteres. Una frase larga es más segura que una palabra con símbolos.',
    );
    expect(tokens).toEqual([{ token: TOKEN }]);
    expect(window.location.hash).toBe('');
  });

  it('con contraseñas distintas o cortas no llama a la API', async () => {
    openLink('/restablecer-contrasena');
    respondToCheck(() => HttpResponse.json(RESET_INFO));
    const bodies = respondToConfirm(() => HttpResponse.json(buildSession()));
    renderWithProviders(<SetPasswordScreen linkPurpose="reset" />);

    const user = await fillPasswords(NEW_PASSWORD, `${NEW_PASSWORD}!`);
    await user.click(
      screen.getByRole('button', { name: 'Guardar contraseña' }),
    );

    expect(
      await screen.findByText('Las contraseñas no coinciden.'),
    ).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/^Nueva contraseña/));
    await user.type(screen.getByLabelText(/^Nueva contraseña/), 'corta');
    await user.click(
      screen.getByRole('button', { name: 'Guardar contraseña' }),
    );

    expect(
      await screen.findByText('Usa al menos 12 caracteres.'),
    ).toBeInTheDocument();
    expect(bodies).toHaveLength(0);
  });

  it('al guardar deja la sesión y entra al panel', async () => {
    openLink('/restablecer-contrasena');
    respondToCheck(() => HttpResponse.json(RESET_INFO));
    const session = buildSession();
    const bodies = respondToConfirm(() => HttpResponse.json(session));
    const { queryClient } = renderWithProviders(
      <SetPasswordScreen linkPurpose="reset" />,
    );

    const user = await fillPasswords(NEW_PASSWORD);
    await user.click(
      screen.getByRole('button', { name: 'Guardar contraseña' }),
    );

    await vi.waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(bodies).toEqual([
      {
        token: TOKEN,
        password: NEW_PASSWORD,
        password_confirmation: NEW_PASSWORD,
      },
    ]);
    expect(queryClient.getQueryData(queryKeys.session())).toEqual(session);
  });

  it('los errores del servidor caen en su campo y se borran las contraseñas', async () => {
    openLink('/restablecer-contrasena');
    respondToCheck(() => HttpResponse.json(RESET_INFO));
    respondToConfirm(() =>
      HttpResponse.json(
        {
          detail: 'Datos no válidos.',
          code: 'validation_error',
          fields: { password: ['No puede ser igual a tu documento.'] },
        },
        { status: 422 },
      ),
    );
    renderWithProviders(<SetPasswordScreen linkPurpose="reset" />);

    const user = await fillPasswords(NEW_PASSWORD);
    await user.click(
      screen.getByRole('button', { name: 'Guardar contraseña' }),
    );

    expect(
      await screen.findByText('No puede ser igual a tu documento.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nueva contraseña/)).toHaveValue('');
    expect(screen.getByLabelText(/^Confirmar contraseña/)).toHaveValue('');
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('si el enlace vence mientras escribe pasa al estado vencido', async () => {
    openLink('/restablecer-contrasena');
    respondToCheck(() => HttpResponse.json(RESET_INFO));
    respondToConfirm(invalidToken);
    renderWithProviders(<SetPasswordScreen linkPurpose="reset" />);

    const user = await fillPasswords(NEW_PASSWORD);
    await user.click(
      screen.getByRole('button', { name: 'Guardar contraseña' }),
    );

    expect(await screen.findByText(EXPIRED)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Guardar contraseña' }),
    ).not.toBeInTheDocument();
  });

  it('si no puede comprobar el enlace ofrece reintentar', async () => {
    openLink('/restablecer-contrasena');
    let calls = 0;
    respondToCheck(() =>
      ++calls === 1
        ? HttpResponse.json(
            { detail: 'Error.', code: 'internal_error', fields: {} },
            { status: 500 },
          )
        : HttpResponse.json(RESET_INFO),
    );
    renderWithProviders(<SetPasswordScreen linkPurpose="reset" />);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Reintentar' }),
    );

    expect(
      await screen.findByRole('button', { name: 'Guardar contraseña' }),
    ).toBeInTheDocument();
  });
});

describe('SetPasswordScreen (invitación)', () => {
  it('saluda por el nombre que devolvió la API', async () => {
    openLink('/crear-contrasena');
    respondToCheck(() =>
      HttpResponse.json({ ...RESET_INFO, purpose: 'invitation' }),
    );

    renderWithProviders(<SetPasswordScreen linkPurpose="invitation" />);

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Te damos la bienvenida, Persona de Prueba',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Crear contraseña' }),
    ).toBeInTheDocument();
  });

  it('con el enlace vencido pide una invitación nueva', async () => {
    openLink('/crear-contrasena');
    respondToCheck(invalidToken);

    renderWithProviders(<SetPasswordScreen linkPurpose="invitation" />);

    expect(await screen.findByText(EXPIRED)).toBeInTheDocument();
    expect(
      screen.getByText(
        'Pide a un administrador que te envíe una invitación nueva.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Pedir un enlace nuevo' }),
    ).not.toBeInTheDocument();
  });
});
