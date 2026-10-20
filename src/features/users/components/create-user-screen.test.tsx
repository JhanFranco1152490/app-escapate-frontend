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

import { clearSavedNotice, readSavedNotice } from '../saved-notice';
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

// Pega el texto en vez de escribirlo tecla por tecla: el formulario recibe los mismos
// eventos y la prueba no depende de lo rápida que esté la máquina.
async function fill(user: UserEvent, label: RegExp, text: string) {
  const field = screen.getByLabelText(label);
  await user.clear(field);
  await user.click(field);
  await user.paste(text);
}

async function fillForm(user: UserEvent) {
  await fill(user, /Nombres/, 'Laura');
  await fill(user, /Apellidos/, 'Rojas');
  await fill(user, /Correo/, 'Laura.Rojas@Example.com');
  await fill(user, /Número de documento/, '1.090.123.456');
  await fill(user, /Celular/, '300 123 4567');
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
    await fill(user, /Correo/, 'laura@');
    await fill(user, /Celular/, '6012345678');

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
    expect(readSavedNotice(9)).toEqual({
      userId: 9,
      kind: 'created',
      invitationSent: false,
    });
    clearSavedNotice();
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

  it('si los roles no cargan lo dice y permite reintentar', async () => {
    let fail = true;
    server.use(
      http.get(apiUrl('/api/roles'), () =>
        fail
          ? HttpResponse.json(
              { detail: 'Error interno.', code: 'internal_error', fields: {} },
              { status: 500 },
            )
          : HttpResponse.json(ROLES),
      ),
    );
    renderWithProviders(
      <SessionGuard>
        <CreateUserScreen />
      </SessionGuard>,
    );

    expect(
      await screen.findByText(/No pudimos cargar los roles/),
    ).toBeInTheDocument();
    fail = false;
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(
      await screen.findByRole('option', { name: 'Operativo' }),
    ).toBeInTheDocument();
  });
});
