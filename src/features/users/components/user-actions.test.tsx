import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';
import { buildUserDetail } from '@/test/users';

import type { UserDetail } from '../api';
import { clearSavedNotice, setSavedNotice } from '../saved-notice';
import { UserDetailScreen } from './user-detail-screen';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

let mutations: string[] = [];

const serveUser = (user: UserDetail) =>
  server.use(
    http.get(apiUrl(`/api/users/${user.id}`), () => HttpResponse.json(user)),
  );

const conflict = (code: string, detail: string, status = 409) =>
  HttpResponse.json({ detail, code, fields: {} }, { status });

beforeEach(() => {
  mutations = [];
  clearSavedNotice();
  serveUser(buildUserDetail({ id: 7 }));
  server.use(
    http.get(apiUrl('/api/users/7/logins'), () =>
      HttpResponse.json({ count: 0, next: null, previous: null, results: [] }),
    ),
  );
});

const renderScreen = async ({
  permissions = ['users.view', 'users.manage'],
  sessionId = 1,
} = {}) => {
  server.use(sessionHandler(buildSession({ id: sessionId, permissions })));
  renderWithProviders(
    <SessionGuard>
      <UserDetailScreen id="7" />
    </SessionGuard>,
  );
  await screen.findByRole('heading', { name: 'Laura Rojas' });
  return userEvent.setup();
};

const statusValue = () =>
  screen.getByText('Estado', { selector: 'dt' }).nextElementSibling;

describe('acciones de la ficha', () => {
  it('desactivar pide confirmación y no llama a la API si se cancela', async () => {
    server.use(
      http.post(apiUrl('/api/users/7/deactivate'), () => {
        mutations.push('deactivate');
        return HttpResponse.json(buildUserDetail({ id: 7, is_active: false }));
      }),
    );
    const user = await renderScreen();

    await user.click(screen.getByRole('button', { name: 'Desactivar' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(
      within(dialog).getByText('¿Desactivar a Laura Rojas?'),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/se cerrarán sus sesiones/)).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(mutations).toEqual([]);
  });

  it('desactivar confirmado deja la ficha inactiva (CA-05)', async () => {
    server.use(
      http.post(apiUrl('/api/users/7/deactivate'), () => {
        mutations.push('deactivate');
        return HttpResponse.json(buildUserDetail({ id: 7, is_active: false }));
      }),
    );
    const user = await renderScreen();

    await user.click(screen.getByRole('button', { name: 'Desactivar' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(
      within(dialog).getByRole('button', { name: 'Desactivar' }),
    );

    expect(
      await screen.findByText(
        'Cuenta desactivada. Se cerraron sus sesiones abiertas.',
      ),
    ).toBeInTheDocument();
    expect(mutations).toEqual(['deactivate']);
    expect(statusValue()).toHaveTextContent('Inactivo');
    expect(screen.getByRole('button', { name: 'Activar' })).toBeInTheDocument();
  });

  it('un 409 al desactivar muestra su detalle dentro del diálogo', async () => {
    server.use(
      http.post(apiUrl('/api/users/7/deactivate'), () =>
        conflict(
          'last_user_manager',
          'Debe quedar al menos una persona activa que pueda gestionar usuarios.',
        ),
      ),
    );
    const user = await renderScreen();

    await user.click(screen.getByRole('button', { name: 'Desactivar' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(
      within(dialog).getByRole('button', { name: 'Desactivar' }),
    );

    expect(
      await within(dialog).findByText(
        'Debe quedar al menos una persona activa que pueda gestionar usuarios.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('activar vuelve a dejar la cuenta activa (CA-06)', async () => {
    serveUser(buildUserDetail({ id: 7, is_active: false }));
    server.use(
      http.post(apiUrl('/api/users/7/activate'), () =>
        HttpResponse.json(buildUserDetail({ id: 7 })),
      ),
    );
    const user = await renderScreen();

    await user.click(screen.getByRole('button', { name: 'Activar' }));

    expect(
      await screen.findByText('Cuenta activada. Ya puede entrar al panel.'),
    ).toBeInTheDocument();
    expect(statusValue()).toHaveTextContent('Activo');
  });

  it('reenviar la invitación avisa del envío o del error del correo', async () => {
    serveUser(
      buildUserDetail({ id: 7, has_password: false, invitation_pending: true }),
    );
    let fail = false;
    server.use(
      http.post(apiUrl('/api/users/7/invitation'), () =>
        fail
          ? conflict(
              'email_delivery_failed',
              'No pudimos enviar el correo. Inténtalo de nuevo.',
              502,
            )
          : new HttpResponse(null, { status: 204 }),
      ),
    );
    const user = await renderScreen();
    const resend = screen.getByRole('button', { name: 'Reenviar invitación' });

    await user.click(resend);
    expect(await screen.findByText('Invitación enviada.')).toBeInTheDocument();

    fail = true;
    await user.click(resend);
    expect(
      await screen.findByText(
        'No pudimos enviar el correo. Inténtalo de nuevo.',
      ),
    ).toBeInTheDocument();
  });

  it('el aviso de invitación fallida trae su propio "Reenviar invitación"', async () => {
    serveUser(
      buildUserDetail({ id: 7, has_password: false, invitation_pending: true }),
    );
    server.use(
      http.post(
        apiUrl('/api/users/7/invitation'),
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
    setSavedNotice({ userId: 7, kind: 'created', invitationSent: false });
    const user = await renderScreen();
    const notice = screen
      .getByText('Usuario creado, pero no pudimos enviar la invitación.')
      .closest('[role="alert"]') as HTMLElement;

    await user.click(
      within(notice).getByRole('button', { name: 'Reenviar invitación' }),
    );

    expect(await screen.findByText('Invitación enviada.')).toBeInTheDocument();
  });

  it('desvincular Google pide confirmación y actualiza la ficha', async () => {
    serveUser(buildUserDetail({ id: 7, google_linked: true }));
    server.use(
      http.delete(apiUrl('/api/users/7/google'), () =>
        HttpResponse.json(buildUserDetail({ id: 7, google_linked: false })),
      ),
    );
    const user = await renderScreen();

    await user.click(
      screen.getByRole('button', { name: 'Desvincular Google' }),
    );
    const dialog = await screen.findByRole('alertdialog');
    await user.click(
      within(dialog).getByRole('button', { name: 'Desvincular' }),
    );

    expect(
      await screen.findByText(
        'Google desvinculado. Se cerraron sus sesiones abiertas.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Google', { selector: 'dt' }).nextElementSibling,
    ).toHaveTextContent('No vinculado');
  });

  it('muestra solo las acciones que corresponden al estado', async () => {
    await renderScreen();

    expect(screen.getByRole('link', { name: 'Editar' })).toHaveAttribute(
      'href',
      '/usuarios/7/editar',
    );
    expect(screen.getByRole('button', { name: 'Desactivar' })).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Activar' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Reenviar invitación' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Desvincular Google' }),
    ).not.toBeInTheDocument();
  });

  it('sin users.manage no se ve ninguna acción', async () => {
    serveUser(
      buildUserDetail({ id: 7, google_linked: true, has_password: false }),
    );
    await renderScreen({ permissions: ['users.view'] });

    expect(
      screen.queryByRole('link', { name: 'Editar' }),
    ).not.toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toEqual([]);
  });

  it('en la propia ficha no se ofrece desactivar', async () => {
    await renderScreen({ sessionId: 7 });

    expect(screen.getByRole('link', { name: 'Editar' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Desactivar' }),
    ).not.toBeInTheDocument();
  });
});
