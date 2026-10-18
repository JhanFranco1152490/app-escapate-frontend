import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { OnUrlUpdateFunction } from 'nuqs/adapters/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';
import { buildUserDetail } from '@/test/users';

import type { LoginEventItem, UserDetail } from '../api';
import { setSavedNotice } from '../saved-notice';
import { UserDetailScreen } from './user-detail-screen';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

let userRequests = 0;

const loginPage = (results: LoginEventItem[], overrides = {}) => ({
  count: results.length,
  next: null,
  previous: null,
  results,
  ...overrides,
});

const serveUser = (user: UserDetail) =>
  server.use(
    http.get(apiUrl(`/api/users/${user.id}`), () => {
      userRequests += 1;
      return HttpResponse.json(user);
    }),
  );

beforeEach(() => {
  userRequests = 0;
  serveUser(buildUserDetail({ id: 7 }));
  server.use(
    http.get(apiUrl('/api/users/7/logins'), () =>
      HttpResponse.json(loginPage([])),
    ),
  );
});

const renderScreen = ({
  id = '7',
  permissions = ['users.view', 'users.manage'],
  searchParams = '',
  onUrlUpdate,
}: {
  id?: string;
  permissions?: string[];
  searchParams?: string;
  onUrlUpdate?: OnUrlUpdateFunction;
} = {}) => {
  server.use(sessionHandler(buildSession({ permissions })));
  return renderWithProviders(
    <SessionGuard>
      <UserDetailScreen id={id} />
    </SessionGuard>,
    { searchParams, onUrlUpdate },
  );
};

const valueOf = (term: string) =>
  screen.getByText(term, { selector: 'dt' }).nextElementSibling;

describe('UserDetailScreen', () => {
  it('muestra los datos registrados (CA-03)', async () => {
    serveUser(
      buildUserDetail({
        id: 7,
        invitation_pending: true,
        has_password: false,
        google_linked: true,
        last_activity_at: null,
      }),
    );
    renderScreen();

    expect(
      await screen.findByRole('heading', { name: 'Laura Rojas' }),
    ).toBeInTheDocument();
    expect(valueOf('Correo')).toHaveTextContent('laura.rojas@example.com');
    expect(valueOf('Documento')).toHaveTextContent(
      'Cédula de ciudadanía 1090123456',
    );
    expect(valueOf('Celular')).toHaveTextContent('+57 300 123 4567');
    expect(valueOf('Rol')).toHaveTextContent('Asesor comercial');
    expect(valueOf('Estado')).toHaveTextContent('Invitación pendiente');
    expect(valueOf('Última actividad')).toHaveTextContent('Nunca');
    expect(valueOf('Creado')).toHaveTextContent('1 de octubre de 2026');
    expect(valueOf('Google')).toHaveTextContent('Vinculado');
    expect(valueOf('Contraseña')).toHaveTextContent('Pendiente');
  });

  it('una cuenta sin celular lo dice', async () => {
    serveUser(buildUserDetail({ id: 7, phone: null }));
    renderScreen();

    await screen.findByRole('heading', { name: 'Laura Rojas' });
    expect(valueOf('Celular')).toHaveTextContent('Sin registrar');
  });

  it.each([
    [
      { kind: 'created', invitationSent: true },
      'Usuario creado. Le enviamos un correo para crear su contraseña.',
    ],
    [
      { kind: 'created', invitationSent: false },
      'Usuario creado, pero no pudimos enviar la invitación.',
    ],
    [
      { kind: 'updated', invitationSent: false },
      'Cambios guardados, pero no pudimos enviar la invitación.',
    ],
    [{ kind: 'updated', invitationSent: null }, 'Cambios guardados.'],
  ] as const)('muestra el aviso guardado %o', async (saved, text) => {
    setSavedNotice({ userId: 7, ...saved });
    renderScreen();

    expect(await screen.findByText(text)).toBeInTheDocument();
  });

  it('el aviso se muestra una sola vez', async () => {
    setSavedNotice({ userId: 7, kind: 'updated', invitationSent: null });
    const { unmount } = renderScreen();
    await screen.findByText('Cambios guardados.');
    unmount();

    renderScreen();

    await screen.findByRole('heading', { name: 'Laura Rojas' });
    expect(screen.queryByText('Cambios guardados.')).not.toBeInTheDocument();
  });

  it('muestra el historial con las tres vías y su nota', async () => {
    server.use(
      http.get(apiUrl('/api/users/7/logins'), () =>
        HttpResponse.json(
          loginPage([
            { created_at: '2026-10-05T20:30:00Z', method: 'document' },
            { created_at: '2026-10-04T13:00:00Z', method: 'google' },
            { created_at: '2026-10-03T13:00:00Z', method: 'email_link' },
          ]),
        ),
      ),
    );
    renderScreen();

    const history = await screen.findByRole('region', {
      name: 'Historial de ingresos',
    });
    const items = await within(history).findAllByRole('listitem');
    expect(items[0]).toHaveTextContent(
      '5 de octubre de 2026, 3:30 p.m.Documento y contraseña',
    );
    expect(items[1]).toHaveTextContent('Google');
    expect(items[2]).toHaveTextContent('Enlace del correo');
    expect(within(history).getByText(/últimos 90 días/)).toBeInTheDocument();
  });

  it('sin ingresos lo dice', async () => {
    renderScreen();

    expect(
      await screen.findByText('Todavía no ha iniciado sesión'),
    ).toBeInTheDocument();
  });

  it('pagina el historial en la URL', async () => {
    let requestedPage: string | null = null;
    server.use(
      http.get(apiUrl('/api/users/7/logins'), ({ request }) => {
        requestedPage = new URL(request.url).searchParams.get('page');
        return HttpResponse.json(
          loginPage(
            [{ created_at: '2026-10-05T20:30:00Z', method: 'document' }],
            { count: 25, next: 'http://api/next' },
          ),
        );
      }),
    );
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    renderScreen({ onUrlUpdate });

    await userEvent
      .setup()
      .click(await screen.findByRole('button', { name: 'Siguiente' }));

    expect(onUrlUpdate.mock.lastCall![0].queryString).toBe('?logins_page=2');
    await vi.waitFor(() => expect(requestedPage).toBe('2'));
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
    renderScreen({ id: '99' });

    expect(
      await screen.findByText('No encontramos este usuario'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Volver a usuarios' }),
    ).toHaveAttribute('href', '/usuarios');
  });

  it.each(['abc', '0', '7.5', '99999999999999999999'])(
    'un id imposible (%s) no llama a la API',
    async (id) => {
      renderScreen({ id });

      expect(
        await screen.findByText('No encontramos este usuario'),
      ).toBeInTheDocument();
      expect(userRequests).toBe(0);
    },
  );
});
