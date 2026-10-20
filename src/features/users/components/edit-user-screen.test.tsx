import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { queryKeys } from '@/lib/api/query-keys';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';
import { buildUserDetail } from '@/test/users';

import { clearSavedNotice, readSavedNotice } from '../saved-notice';
import { EditUserScreen } from './edit-user-screen';

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

let storedUser = buildUserDetail({ id: 7 });
let updates: unknown[] = [];

beforeEach(() => {
  router.push.mockReset();
  clearSavedNotice();
  storedUser = buildUserDetail({ id: 7 });
  updates = [];
  server.use(
    sessionHandler(
      buildSession({ permissions: ['users.view', 'users.manage'] }),
    ),
    http.get(apiUrl('/api/users/7'), () => HttpResponse.json(storedUser)),
    http.put(apiUrl('/api/users/7'), async ({ request }) => {
      updates.push(await request.json());
      return HttpResponse.json({ user: storedUser, invitation_sent: null });
    }),
  );
});

const renderScreen = async (id = '7') => {
  const result = renderWithProviders(
    <SessionGuard>
      <EditUserScreen id={id} />
    </SessionGuard>,
  );
  return { ...result, user: userEvent.setup() };
};

const loaded = () => screen.findByRole('heading', { name: 'Editar usuario' });

describe('EditUserScreen', () => {
  it('arranca con los datos actuales', async () => {
    await renderScreen();
    await loaded();

    expect(screen.getByLabelText(/Nombres/)).toHaveValue('Laura');
    expect(screen.getByLabelText(/Apellidos/)).toHaveValue('Rojas');
    expect(screen.getByLabelText(/Correo/)).toHaveValue(
      'laura.rojas@example.com',
    );
    expect(screen.getByLabelText(/Tipo de documento/)).toHaveValue('CC');
    expect(screen.getByLabelText(/Número de documento/)).toHaveValue(
      '1090123456',
    );
    expect(screen.getByLabelText(/Celular/)).toHaveValue('3001234567');
  });

  it('muestra el rol sin permitir cambiarlo', async () => {
    await renderScreen();
    await loaded();

    const role = screen.getByLabelText('Rol');
    expect(role).toHaveValue('Asesor comercial');
    expect(role).toHaveAttribute('readonly');
    expect(
      screen.queryByRole('combobox', { name: /Rol/ }),
    ).not.toBeInTheDocument();
  });

  it('envía solo los cinco datos editables y vuelve a la ficha', async () => {
    const { user } = await renderScreen();
    await loaded();
    const lastName = screen.getByLabelText(/Apellidos/);
    await user.clear(lastName);
    await user.type(lastName, 'Rojas Pérez');
    await user.clear(screen.getByLabelText(/Celular/));
    await user.type(screen.getByLabelText(/Celular/), '+57 310 000 0000');

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith('/usuarios/7'),
    );
    expect(updates).toEqual([
      {
        first_name: 'Laura',
        last_name: 'Rojas Pérez',
        email: 'laura.rojas@example.com',
        document_type: 'CC',
        document_number: '1090123456',
        phone: '3100000000',
      },
    ]);
    expect(readSavedNotice(7)).toEqual({
      userId: 7,
      kind: 'updated',
      invitationSent: null,
    });
  });

  it('una cuenta sin celular lo exige al guardar', async () => {
    storedUser = buildUserDetail({ id: 7, phone: null });
    const { user } = await renderScreen();
    await loaded();

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(
      await screen.findByText('Falta 1 campo obligatorio.'),
    ).toBeInTheDocument();
    expect(updates).toEqual([]);
  });

  it('un dato repetido según el servidor cae en su campo', async () => {
    server.use(
      http.put(apiUrl('/api/users/7'), () =>
        HttpResponse.json(
          {
            detail: 'Revisa los datos enviados.',
            code: 'validation_error',
            fields: {
              document_number: ['Ya existe un usuario con ese documento.'],
            },
          },
          { status: 422 },
        ),
      ),
    );
    const { user } = await renderScreen();
    await loaded();

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(
      await screen.findByText('Ya existe un usuario con ese documento.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Número de documento/)).toHaveFocus();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('una nueva lectura de la ficha no pisa lo que se está escribiendo', async () => {
    const { user, queryClient } = await renderScreen();
    await loaded();
    const firstName = screen.getByLabelText(/Nombres/);
    await user.clear(firstName);
    await user.type(firstName, 'Laurita');

    storedUser = buildUserDetail({ id: 7, first_name: 'Otro nombre' });
    await queryClient.refetchQueries({ queryKey: queryKeys.users.detail(7) });

    expect(firstName).toHaveValue('Laurita');
  });

  it('un id inexistente muestra "No encontramos este usuario"', async () => {
    server.use(
      http.get(apiUrl('/api/users/99'), () =>
        HttpResponse.json(
          { detail: 'No encontrado.', code: 'not_found', fields: {} },
          { status: 404 },
        ),
      ),
    );
    await renderScreen('99');

    expect(
      await screen.findByText('No encontramos este usuario'),
    ).toBeInTheDocument();
  });

  it('Cancelar vuelve a la ficha', async () => {
    await renderScreen();
    await loaded();

    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute(
      'href',
      '/usuarios/7',
    );
  });
});
