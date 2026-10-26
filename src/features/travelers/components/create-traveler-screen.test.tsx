import { screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { clearPageNotice, readPageNotice } from '@/lib/page-notice';
import {
  buildClientDetail,
  buildClientListItem,
  buildCompanyDetail,
  buildPage,
  buildTravelerDetail,
} from '@/test/clients';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { CreateTravelerScreen } from './create-traveler-screen';

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const ALL = ['clients.view', 'travelers.view', 'travelers.manage'];

let created: Record<string, unknown>[] = [];
let clientRequests = 0;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-26T15:00:00Z'));
  router.push.mockReset();
  created = [];
  clientRequests = 0;
  server.use(
    http.get(apiUrl('/api/clients/12'), () => {
      clientRequests += 1;
      return HttpResponse.json(buildClientDetail());
    }),
    http.get(apiUrl('/api/clients/13'), () =>
      HttpResponse.json(buildCompanyDetail()),
    ),
    http.get(apiUrl('/api/clients'), () =>
      HttpResponse.json(
        buildPage([
          buildClientListItem({ display_name: 'Marcela Gómez Ortiz' }),
        ]),
      ),
    ),
    http.post(apiUrl('/api/travelers'), async ({ request }) => {
      created.push((await request.json()) as Record<string, unknown>);
      return HttpResponse.json(buildTravelerDetail({ id: 33 }), {
        status: 201,
      });
    }),
  );
});

afterEach(() => {
  vi.useRealTimers();
  clearPageNotice();
});

const renderScreen = async ({
  searchParams = '',
  permissions = ALL,
}: { searchParams?: string; permissions?: string[] } = {}) => {
  server.use(sessionHandler(buildSession({ permissions })));
  renderWithProviders(
    <SessionGuard>
      <CreateTravelerScreen />
    </SessionGuard>,
    { searchParams },
  );
  await screen.findByRole('button', { name: 'Guardar viajero' });
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

async function fillMinor(user: UserEvent) {
  await fill(user, /^Nombres/, 'Sofía');
  await fill(user, /^Apellidos/, 'Gómez Ruiz');
  await user.selectOptions(
    screen.getByLabelText(/Tipo de documento/),
    'Tarjeta de identidad',
  );
  await fill(user, /Número de documento/, '1090123456');
  await fill(user, /Fecha de nacimiento/, '2014-03-12');
}

const consent = () =>
  screen.getByRole('checkbox', { name: /autorización del viajero/ });
const theClient = () =>
  screen.queryByRole('checkbox', { name: 'Es el mismo cliente' });
const save = (user: UserEvent) =>
  user.click(screen.getByRole('button', { name: 'Guardar viajero' }));

describe('CreateTravelerScreen', () => {
  it('registra un viajero sin cliente de referencia y lleva a su ficha', async () => {
    const user = await renderScreen();
    await fillMinor(user);
    await user.click(consent());

    await save(user);

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith('/viajeros/33'),
    );
    expect(created).toEqual([
      {
        first_name: 'Sofía',
        last_name: 'Gómez Ruiz',
        document_type: 'TI',
        document_number: '1090123456',
        birth_date: '2014-03-12',
        nationality: 'CO',
        reference_client_id: null,
        is_the_client: false,
        notes: null,
        data_consent: true,
      },
    ]);
    expect(readPageNotice('traveler:33')).toBe('Viajero registrado.');
  });

  it('con datos vacíos o sin autorización no llama a la API', async () => {
    const user = await renderScreen();

    await save(user);

    expect(
      await screen.findByText('Faltan 5 campos obligatorios.'),
    ).toBeInTheDocument();
    expect(created).toHaveLength(0);
  });

  it('avisa, sin bloquear, una TI de alguien que ya tiene 18 años', async () => {
    const user = await renderScreen();
    await fillMinor(user);
    const warning =
      'Revisa el tipo de documento: por la edad, normalmente correspondería CC.';

    await fill(user, /Fecha de nacimiento/, '2008-10-27');
    expect(screen.queryByText(warning)).not.toBeInTheDocument();
    await fill(user, /Fecha de nacimiento/, '2008-10-26');
    expect(screen.getByText(warning)).toBeInTheDocument();

    await user.click(consent());
    await save(user);
    await waitFor(() => expect(created).toHaveLength(1));
  });

  it('desde la ficha de un cliente llega con ese cliente elegido', async () => {
    const user = await renderScreen({ searchParams: '?client_id=12' });

    expect(screen.getByText('Marcela Gómez Ortiz')).toBeInTheDocument();
    expect(theClient()).not.toBeChecked();
    await fillMinor(user);
    await user.click(consent());
    await save(user);

    await waitFor(() => expect(created).toHaveLength(1));
    expect(created[0]).toMatchObject({
      reference_client_id: 12,
      is_the_client: false,
    });
  });

  it('"Registrar como viajero" llena el formulario con los datos del cliente', async () => {
    const user = await renderScreen({ searchParams: '?from_client=12' });

    expect(screen.getByLabelText(/^Nombres/)).toHaveValue('Marcela');
    expect(screen.getByLabelText(/^Apellidos/)).toHaveValue('Gómez Ortiz');
    expect(screen.getByLabelText(/Número de documento/)).toHaveValue(
      '1020304050',
    );
    expect(screen.getByLabelText(/Fecha de nacimiento/)).toHaveValue(
      '1988-04-15',
    );
    expect(theClient()).toBeChecked();
    await user.click(consent());
    await save(user);

    await waitFor(() => expect(created).toHaveLength(1));
    expect(created[0]).toMatchObject({
      first_name: 'Marcela',
      document_type: 'CC',
      reference_client_id: 12,
      is_the_client: true,
    });
  });

  it('con una empresa no ofrece "Es el mismo cliente" ni copia sus datos', async () => {
    await renderScreen({ searchParams: '?from_client=13' });

    expect(screen.getByText('Viajes Andinos S.A.S.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nombres/)).toHaveValue('');
    expect(theClient()).not.toBeInTheDocument();
  });

  it('busca y elige el cliente de referencia', async () => {
    const user = await renderScreen();

    await fill(user, /Cliente de referencia/, 'gomez');
    await user.click(
      await screen.findByRole('button', { name: /Marcela Gómez Ortiz/ }),
    );

    expect(theClient()).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Quitar' }));
    expect(theClient()).not.toBeInTheDocument();
    expect(
      screen.getByRole('searchbox', { name: 'Buscar cliente de referencia' }),
    ).toBeInTheDocument();
  });

  it('sin clients.view no pide el cliente ni deja buscar', async () => {
    await renderScreen({
      searchParams: '?client_id=12',
      permissions: ['travelers.view', 'travelers.manage'],
    });

    expect(clientRequests).toBe(0);
    expect(
      screen.queryByRole('searchbox', { name: /cliente de referencia/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /Para elegir uno se necesita el permiso de ver clientes/,
      ),
    ).toBeInTheDocument();
  });

  it('los errores del servidor caen en su campo', async () => {
    server.use(
      http.post(apiUrl('/api/travelers'), () =>
        HttpResponse.json(
          {
            detail: 'Datos inválidos.',
            code: 'validation_error',
            fields: {
              is_the_client: ['Este cliente ya tiene su ficha de viajero.'],
              document_number: ['Ya existe un viajero con ese documento.'],
            },
          },
          { status: 422 },
        ),
      ),
    );
    const user = await renderScreen({ searchParams: '?from_client=12' });
    await user.click(consent());

    await save(user);

    expect(
      await screen.findByText('Este cliente ya tiene su ficha de viajero.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Ya existe un viajero con ese documento.'),
    ).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });
});
