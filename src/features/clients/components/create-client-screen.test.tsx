import { screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { clearPageNotice, readPageNotice } from '@/lib/page-notice';
import {
  buildClientDetail,
  buildClientListItem,
  buildPage,
} from '@/test/clients';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { CreateClientScreen } from './create-client-screen';

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

let searches: string[] = [];
let created: unknown[] = [];

const respondToSearch = (results = [buildClientListItem()]) =>
  server.use(
    http.get(apiUrl('/api/clients'), ({ request }) => {
      searches.push(new URL(request.url).searchParams.get('q') ?? '');
      return HttpResponse.json(buildPage(results));
    }),
  );

beforeEach(() => {
  router.push.mockReset();
  searches = [];
  created = [];
  respondToSearch([]);
  server.use(
    sessionHandler(
      buildSession({ permissions: ['clients.view', 'clients.manage'] }),
    ),
    http.post(apiUrl('/api/clients'), async ({ request }) => {
      created.push(await request.json());
      return HttpResponse.json(buildClientDetail({ id: 21 }), { status: 201 });
    }),
  );
});

afterEach(() => {
  clearPageNotice();
});

const renderScreen = async (searchParams = '') => {
  renderWithProviders(
    <SessionGuard>
      <CreateClientScreen />
    </SessionGuard>,
    { searchParams },
  );
  await screen.findByRole('heading', { name: 'Nuevo cliente' });
  return userEvent.setup();
};

// Pega el texto en vez de escribirlo tecla por tecla: el formulario recibe los mismos
// eventos y la prueba no depende de lo rápida que esté la máquina.
async function fill(user: UserEvent, label: RegExp, text: string) {
  const field = screen.getByRole('textbox', { name: label });
  await user.clear(field);
  await user.click(field);
  await user.paste(text);
}

async function fillForm(user: UserEvent, phone = '300 111 2233') {
  await fill(user, /Nombres/, 'Marcela');
  await fill(user, /Apellidos/, 'Gómez Ortiz');
  await fill(user, /Teléfono/, phone);
  // Salir del teléfono es lo que dispara la revisión de repetidos.
  await user.selectOptions(
    screen.getByLabelText(/Medio de contacto/),
    'WhatsApp',
  );
  await user.click(screen.getByRole('checkbox'));
}

const submit = (user: UserEvent) =>
  user.click(screen.getByRole('button', { name: 'Guardar cliente' }));

describe('CreateClientScreen', () => {
  it('registra el cliente con la autorización y lleva a su ficha con un aviso', async () => {
    const user = await renderScreen();
    await fillForm(user);

    await submit(user);

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith('/clientes/21'),
    );
    expect(created).toEqual([
      expect.objectContaining({
        first_name: 'Marcela',
        phone: '+573001112233',
        data_consent: true,
      }),
    ]);
    expect(readPageNotice('client:21')).toBe('Cliente registrado.');
  });

  it('avisa sin bloquear si ya hay clientes con ese teléfono', async () => {
    respondToSearch([
      buildClientListItem({ id: 5, display_name: 'Marcela Gómez' }),
      buildClientListItem({ id: 6, display_name: 'Pedro Gómez' }),
      // La búsqueda también encuentra por nombre o documento: este no comparte el teléfono.
      buildClientListItem({ id: 7, phone: '+573109998877' }),
    ]);
    const user = await renderScreen();
    await fillForm(user);

    expect(
      await screen.findByText('Ya hay 2 clientes con este teléfono'),
    ).toBeInTheDocument();
    expect(searches.at(-1)).toBe('573001112233');
    expect(screen.getByRole('link', { name: 'Pedro Gómez' })).toHaveAttribute(
      'href',
      '/clientes/6',
    );

    await submit(user);
    await waitFor(() => expect(created).toHaveLength(1));
  });

  it('sin coincidencias no muestra el aviso', async () => {
    respondToSearch([buildClientListItem({ phone: '+573109998877' })]);
    const user = await renderScreen();
    await fillForm(user);

    await waitFor(() => expect(searches).toHaveLength(1));
    expect(screen.queryByText(/con este teléfono/)).not.toBeInTheDocument();
  });

  it('con un teléfono inválido no busca repetidos', async () => {
    const user = await renderScreen();
    await fillForm(user, '300 111');

    expect(searches).toHaveLength(0);
  });

  it('el documento repetido cae en su campo', async () => {
    server.use(
      http.post(apiUrl('/api/clients'), () =>
        HttpResponse.json(
          {
            detail: 'Datos inválidos.',
            code: 'validation_error',
            fields: {
              document_number: ['Ya existe un cliente con ese documento.'],
            },
          },
          { status: 422 },
        ),
      ),
    );
    const user = await renderScreen();
    await fillForm(user);
    await fill(user, /Número de documento/, '1020304050');

    await submit(user);

    expect(
      await screen.findByText('Ya existe un cliente con ese documento.'),
    ).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });
});

describe('CreateClientScreen: volver a otra pantalla', () => {
  it('con next vuelve a esa pantalla con el cliente nuevo elegido', async () => {
    const user = await renderScreen('?next=/solicitudes/nueva');
    await fillForm(user);

    await submit(user);

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith(
        '/solicitudes/nueva?client_id=21',
      ),
    );
  });

  it('conserva la consulta que ya traía next', async () => {
    const user = await renderScreen(
      `?next=${encodeURIComponent('/solicitudes/nueva?client_id=3')}`,
    );
    await fillForm(user);

    await submit(user);

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith(
        '/solicitudes/nueva?client_id=21',
      ),
    );
  });

  it('Cancelar vuelve a next', async () => {
    await renderScreen('?next=/solicitudes/nueva');

    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute(
      'href',
      '/solicitudes/nueva',
    );
  });

  it.each(['//otro.example.com', 'https://otro.example.com'])(
    'ignora un next que lleva a otro sitio (%s)',
    async (next) => {
      const user = await renderScreen(`?next=${encodeURIComponent(next)}`);
      await fillForm(user);

      await submit(user);

      await waitFor(() =>
        expect(router.push).toHaveBeenCalledWith('/clientes/21'),
      );
      expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute(
        'href',
        '/clientes',
      );
    },
  );
});
