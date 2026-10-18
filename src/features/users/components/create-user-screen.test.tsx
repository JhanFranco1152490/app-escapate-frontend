import { screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';
import { ROLES, buildUserDetail } from '@/test/users';

import { takeSavedNotice } from '../saved-notice';
import { CreateUserScreen } from './create-user-screen';

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

let createRequests: unknown[] = [];

beforeEach(() => {
  router.push.mockReset();
  createRequests = [];
  server.use(
    sessionHandler(
      buildSession({ permissions: ['users.view', 'users.manage'] }),
    ),
    http.get(apiUrl('/api/roles'), () => HttpResponse.json(ROLES)),
    http.post(apiUrl('/api/users'), async ({ request }) => {
      createRequests.push(await request.json());
      return HttpResponse.json(
        { user: buildUserDetail({ id: 9 }), invitation_sent: false },
        { status: 201 },
      );
    }),
  );
});

const renderScreen = async () => {
  renderWithProviders(
    <SessionGuard>
      <CreateUserScreen />
    </SessionGuard>,
  );
  await screen.findByRole('heading', { name: 'Nuevo usuario' });
  // El selector de rol necesita los roles para poder elegir uno.
  await screen.findByRole('option', { name: 'Operativo' });
  return userEvent.setup();
};

async function fillForm(user: UserEvent) {
  await user.type(screen.getByLabelText(/Nombres/), 'Laura');
  await user.type(screen.getByLabelText(/Apellidos/), 'Rojas');
  await user.type(screen.getByLabelText(/Correo/), 'Laura.Rojas@Example.com');
  await user.type(
    screen.getByLabelText(/Número de documento/),
    '1.090.123.456',
  );
  await user.type(screen.getByLabelText(/Celular/), '300 123 4567');
  await user.selectOptions(screen.getByLabelText(/Rol/), 'Asesor comercial');
}

const submit = (user: UserEvent) =>
  user.click(screen.getByRole('button', { name: 'Crear usuario' }));

describe('CreateUserScreen', () => {
  it('con campos vacíos no llama a la API y dice cuántos faltan', async () => {
    const user = await renderScreen();

    await submit(user);

    expect(
      await screen.findByText('Faltan 6 campos obligatorios.'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Este campo es obligatorio.')).toHaveLength(5);
    expect(screen.getByText('Selecciona un rol.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombres/)).toHaveFocus();
    expect(createRequests).toHaveLength(0);
  });

  it('con formatos inválidos no llama a la API y marca cada campo', async () => {
    const user = await renderScreen();
    await fillForm(user);
    await user.clear(screen.getByLabelText(/Correo/));
    await user.type(screen.getByLabelText(/Correo/), 'laura@');
    await user.clear(screen.getByLabelText(/Celular/));
    await user.type(screen.getByLabelText(/Celular/), '6012345678');

    await submit(user);

    expect(
      await screen.findByText('Revisa los campos marcados.'),
    ).toBeInTheDocument();
    expect(screen.getByText('No es un correo válido.')).toBeInTheDocument();
    expect(
      screen.getByText('Debe ser un celular colombiano de 10 dígitos.'),
    ).toBeInTheDocument();
    expect(createRequests).toHaveLength(0);
  });

  it('envía los datos normalizados y lleva a la ficha con el aviso', async () => {
    const user = await renderScreen();
    await fillForm(user);

    await submit(user);

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith('/usuarios/9'),
    );
    expect(createRequests).toEqual([
      {
        first_name: 'Laura',
        last_name: 'Rojas',
        email: 'laura.rojas@example.com',
        document_type: 'CC',
        document_number: '1090123456',
        phone: '3001234567',
        role_id: 2,
      },
    ]);
    expect(takeSavedNotice(9)).toEqual({
      userId: 9,
      kind: 'created',
      invitationSent: false,
    });
  });

  it('los errores de campo del servidor caen en su campo', async () => {
    server.use(
      http.post(apiUrl('/api/users'), () =>
        HttpResponse.json(
          {
            detail: 'Revisa los datos enviados.',
            code: 'validation_error',
            fields: {
              email: ['Ya existe un usuario con ese correo.'],
              document_number: ['Ya existe un usuario con ese documento.'],
              phone: ['Ya existe un usuario con ese teléfono.'],
              role_id: ['El rol no existe.'],
            },
          },
          { status: 422 },
        ),
      ),
    );
    const user = await renderScreen();
    await fillForm(user);

    await submit(user);

    expect(
      await screen.findByText('Ya existe un usuario con ese correo.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Ya existe un usuario con ese documento.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Ya existe un usuario con ese teléfono.'),
    ).toBeInTheDocument();
    expect(screen.getByText('El rol no existe.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo/)).toHaveFocus();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('ante un error inesperado muestra un aviso general', async () => {
    server.use(
      http.post(apiUrl('/api/users'), () =>
        HttpResponse.json(
          { detail: 'Error interno.', code: 'internal_error', fields: {} },
          { status: 500 },
        ),
      ),
    );
    const user = await renderScreen();
    await fillForm(user);

    await submit(user);

    expect(
      await screen.findByText(
        'No pudimos guardar el usuario. Inténtalo de nuevo.',
      ),
    ).toBeInTheDocument();
  });

  it('recuerda pedir la verificación en dos pasos y permite cancelar', async () => {
    await renderScreen();

    expect(screen.getByText(/verificación en dos pasos/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute(
      'href',
      '/usuarios',
    );
  });
});
