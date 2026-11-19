import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { buildPage, buildTravelerListItem } from '@/test/clients';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';
import {
  buildClosedRequestDetail,
  buildRequestMinor,
  buildRequestTraveler,
  buildTravelRequestDetail,
} from '@/test/travel-requests';

import type { TravelRequestDetail } from '../api';
import type { RequestTraveler } from '../request-travelers-api';
import { RequestTravelersSection } from './request-travelers-section';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

const PATH = '/api/travel-requests/231/travelers';
const VIEW = ['travelers.view', 'travel_requests.view'];
const MANAGE = [...VIEW, 'travel_requests.manage'];

let added: unknown[] = [];
let removed: string[] = [];

beforeEach(() => {
  added = [];
  removed = [];
});

const serveTravelers = (travelers: RequestTraveler[]) =>
  server.use(http.get(apiUrl(PATH), () => HttpResponse.json(travelers)));

const renderSection = ({
  request = buildTravelRequestDetail(),
  permissions = MANAGE,
}: { request?: TravelRequestDetail; permissions?: string[] } = {}) => {
  server.use(sessionHandler(buildSession({ permissions })));
  renderWithProviders(
    <SessionGuard>
      <RequestTravelersSection request={request} />
    </SessionGuard>,
  );
};

const apiError = (status: number, code: string, detail: string) =>
  HttpResponse.json({ detail, code, fields: {} }, { status });

describe('RequestTravelersSection', () => {
  it('lista a los viajeros con su documento, quién los agregó y si son menores', async () => {
    serveTravelers([buildRequestTraveler(), buildRequestMinor()]);
    renderSection();

    const sofia = await screen.findByRole('link', { name: 'Sofía Gómez Ruiz' });
    expect(sofia).toHaveAttribute('href', '/viajeros/30');
    const row = sofia.closest('li')!;
    expect(row).toHaveTextContent('TI 1090123456');
    expect(row).toHaveTextContent('12 años');
    expect(row).toHaveTextContent('Menor');
    expect(row).toHaveTextContent(
      'Agregado por Andrés Peña el 12 de noviembre',
    );
    const marcela = screen.getByRole('link', { name: 'Marcela Gómez Ortiz' });
    expect(marcela.closest('li')).toHaveTextContent('Es el cliente');
  });

  it('avisa que las cantidades coinciden con lo pedido', async () => {
    serveTravelers([
      buildRequestTraveler({ id: 1 }),
      buildRequestTraveler({ id: 2 }),
      buildRequestMinor(),
    ]);
    renderSection();

    await screen.findByRole('link', { name: 'Sofía Gómez Ruiz' });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Coinciden con lo que pidió el cliente: 2 adultos · 1 menor.',
    );
  });

  it('avisa cuando faltan adultos', async () => {
    serveTravelers([buildRequestTraveler(), buildRequestMinor()]);
    renderSection();

    await screen.findByRole('link', { name: 'Sofía Gómez Ruiz' });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Falta 1 adulto. La solicitud pide 2 adultos · 1 menor; hay 1 adulto · 1 menor.',
    );
  });

  it('sin viajeros dice qué pide la solicitud y no compara', async () => {
    serveTravelers([]);
    renderSection();

    expect(
      await screen.findByText(
        /Todavía no hay viajeros asociados\. La solicitud pide 2 adultos · 1 menor\./,
      ),
    ).toBeVisible();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('sin permiso para ver viajeros no muestra la sección ni la pide', async () => {
    // Sin handler de viajeros: pedirlos haría fallar la prueba.
    renderSection({ permissions: ['travel_requests.view'] });

    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Viajeros de la solicitud' }),
      ).not.toBeInTheDocument(),
    );
  });

  it('quien solo puede ver no tiene agregar ni quitar', async () => {
    serveTravelers([buildRequestTraveler()]);
    renderSection({ permissions: VIEW });

    await screen.findByRole('link', { name: 'Marcela Gómez Ortiz' });
    expect(
      screen.queryByRole('button', { name: 'Agregar viajeros' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^Quitar/ }),
    ).not.toBeInTheDocument();
  });

  it('en una solicitud cerrada muestra los viajeros sin agregar ni quitar', async () => {
    serveTravelers([buildRequestTraveler()]);
    renderSection({ request: buildClosedRequestDetail() });

    await screen.findByRole('link', { name: 'Marcela Gómez Ortiz' });
    expect(screen.getByText(/La solicitud está cerrada/)).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Agregar viajeros' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^Quitar/ }),
    ).not.toBeInTheDocument();
  });

  it('si la lista no carga ofrece reintentar', async () => {
    server.use(
      http.get(apiUrl(PATH), () => apiError(500, 'server_error', 'Falló')),
    );
    renderSection();

    expect(
      await screen.findByText(/No pudimos cargar los viajeros/),
    ).toBeVisible();

    serveTravelers([buildRequestTraveler()]);
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(
      await screen.findByRole('link', { name: 'Marcela Gómez Ortiz' }),
    ).toBeVisible();
  });

  describe('quitar', () => {
    const serveRemoval = (respond: () => Response) =>
      server.use(
        http.delete(apiUrl(`${PATH}/:travelerId`), ({ params }) => {
          removed.push(String(params.travelerId));
          return respond();
        }),
      );

    it('pide confirmación, quita la asociación y avisa', async () => {
      serveTravelers([buildRequestTraveler(), buildRequestMinor()]);
      serveRemoval(() => new HttpResponse(null, { status: 204 }));
      renderSection();

      await userEvent.click(
        await screen.findByRole('button', {
          name: 'Quitar a Sofía Gómez Ruiz',
        }),
      );
      const dialog = await screen.findByRole('alertdialog');
      expect(dialog).toHaveTextContent('Sus datos no se borran');
      expect(removed).toEqual([]);
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Quitar' }),
      );

      expect(
        await screen.findByText('Sofía Gómez Ruiz ya no está en la solicitud.'),
      ).toBeVisible();
      expect(removed).toEqual(['30']);
      expect(
        screen.queryByRole('link', { name: 'Sofía Gómez Ruiz' }),
      ).not.toBeInTheDocument();
    });

    it('cancelar no quita a nadie', async () => {
      serveTravelers([buildRequestMinor()]);
      renderSection();

      await userEvent.click(
        await screen.findByRole('button', {
          name: 'Quitar a Sofía Gómez Ruiz',
        }),
      );
      await userEvent.click(
        within(await screen.findByRole('alertdialog')).getByRole('button', {
          name: 'Cancelar',
        }),
      );

      await waitFor(() =>
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
      expect(removed).toEqual([]);
      expect(
        screen.getByRole('link', { name: 'Sofía Gómez Ruiz' }),
      ).toBeVisible();
    });

    it('si la solicitud se cerró, el diálogo dice el motivo y la lista no cambia', async () => {
      serveTravelers([buildRequestMinor()]);
      serveRemoval(() =>
        apiError(
          409,
          'travel_request_closed',
          'La solicitud está cerrada. Reábrela para modificarla.',
        ),
      );
      renderSection();

      await userEvent.click(
        await screen.findByRole('button', {
          name: 'Quitar a Sofía Gómez Ruiz',
        }),
      );
      const dialog = await screen.findByRole('alertdialog');
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Quitar' }),
      );

      expect(
        await within(dialog).findByText(
          'La solicitud está cerrada. Reábrela para modificarla.',
        ),
      ).toBeVisible();
      expect(
        screen.getByRole('link', { name: 'Sofía Gómez Ruiz', hidden: true }),
      ).toBeInTheDocument();
    });
  });

  describe('agregar', () => {
    const client = buildRequestTraveler();
    const sofia = buildTravelerListItem();
    const luis = buildTravelerListItem({
      id: 40,
      first_name: 'Luis',
      last_name: 'Pérez',
      full_name: 'Luis Pérez',
      document_type: 'CC',
      document_number: '79555111',
      age: 45,
      is_minor: false,
    });
    let travelerQueries: URLSearchParams[] = [];

    beforeEach(() => {
      travelerQueries = [];
      serveTravelers([client]);
      server.use(
        http.get(apiUrl('/api/travelers'), ({ request }) => {
          const query = new URL(request.url).searchParams;
          travelerQueries.push(query);
          const all = [
            buildTravelerListItem({
              id: 31,
              full_name: 'Marcela Gómez Ortiz',
              first_name: 'Marcela',
              last_name: 'Gómez Ortiz',
            }),
            sofia,
            luis,
          ];
          return HttpResponse.json(
            buildPage(query.get('client_id') ? all.slice(0, 2) : all),
          );
        }),
      );
    });

    const openDialog = async () => {
      await userEvent.click(
        await screen.findByRole('button', { name: 'Agregar viajeros' }),
      );
      return screen.findByRole('alertdialog');
    };

    it('empieza por los viajeros del cliente y se puede ampliar a todos', async () => {
      renderSection();
      const dialog = await openDialog();

      await within(dialog).findByRole('checkbox', { name: /Sofía Gómez Ruiz/ });
      expect(travelerQueries[0].get('client_id')).toBe('7');
      expect(
        within(dialog).queryByRole('checkbox', { name: /Luis Pérez/ }),
      ).not.toBeInTheDocument();

      await userEvent.click(
        within(dialog).getByRole('checkbox', {
          name: /Solo viajeros de Marcela Gómez Ortiz/,
        }),
      );
      expect(
        await within(dialog).findByRole('checkbox', { name: /Luis Pérez/ }),
      ).toBeVisible();
      expect(travelerQueries.at(-1)!.get('client_id')).toBeNull();
    });

    it('los que ya están en la solicitud se ven marcados y no se pueden elegir', async () => {
      renderSection();
      const dialog = await openDialog();

      const marcela = await within(dialog).findByRole('checkbox', {
        name: /^Marcela Gómez Ortiz/,
      });
      expect(marcela).toBeChecked();
      expect(marcela).toBeDisabled();
      expect(dialog).toHaveTextContent('Ya está en la solicitud');
      expect(
        within(dialog).getByRole('button', { name: 'Agregar' }),
      ).toBeDisabled();
    });

    it('agrega varios a la vez y actualiza la lista', async () => {
      server.use(
        http.post(apiUrl(PATH), async ({ request }) => {
          added.push(await request.json());
          return HttpResponse.json([client, buildRequestMinor()]);
        }),
      );
      renderSection();
      const dialog = await openDialog();

      await userEvent.click(
        await within(dialog).findByRole('checkbox', {
          name: /Sofía Gómez Ruiz/,
        }),
      );
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Agregar (1)' }),
      );

      expect(
        await screen.findByText('Viajero agregado a la solicitud.'),
      ).toBeVisible();
      expect(added).toEqual([{ traveler_ids: [30] }]);
      expect(
        screen.getByRole('link', { name: 'Sofía Gómez Ruiz' }),
      ).toBeVisible();
      await waitFor(() =>
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
    });

    it('conserva lo elegido al buscar otra cosa', async () => {
      renderSection();
      const dialog = await openDialog();

      await userEvent.click(
        await within(dialog).findByRole('checkbox', {
          name: /Sofía Gómez Ruiz/,
        }),
      );
      await userEvent.type(
        within(dialog).getByRole('searchbox', { name: 'Buscar viajero' }),
        'Luis',
      );
      await waitFor(() =>
        expect(travelerQueries.at(-1)!.get('q')).toBe('Luis'),
      );

      expect(
        within(dialog).getByRole('button', { name: 'Agregar (1)' }),
      ).toBeEnabled();
    });

    it('si el servidor rechaza, el diálogo sigue abierto con el motivo', async () => {
      server.use(
        http.post(apiUrl(PATH), () =>
          apiError(
            409,
            'travel_request_closed',
            'La solicitud está cerrada. Reábrela para modificarla.',
          ),
        ),
      );
      renderSection();
      const dialog = await openDialog();

      await userEvent.click(
        await within(dialog).findByRole('checkbox', {
          name: /Sofía Gómez Ruiz/,
        }),
      );
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Agregar (1)' }),
      );

      expect(
        await within(dialog).findByText(
          'La solicitud está cerrada. Reábrela para modificarla.',
        ),
      ).toBeVisible();
    });

    it('si alguno ya no existe (422) lo dice y deja volver a elegir', async () => {
      server.use(
        http.post(apiUrl(PATH), () =>
          HttpResponse.json(
            {
              detail: 'Datos inválidos',
              code: 'validation_error',
              fields: { traveler_ids: ['No existe'] },
            },
            { status: 422 },
          ),
        ),
      );
      renderSection();
      const dialog = await openDialog();

      await userEvent.click(
        await within(dialog).findByRole('checkbox', {
          name: /Sofía Gómez Ruiz/,
        }),
      );
      await userEvent.click(
        within(dialog).getByRole('button', { name: 'Agregar (1)' }),
      );

      expect(await within(dialog).findByText(/ya no existe/)).toBeVisible();
      expect(
        within(dialog).getByRole('button', { name: 'Agregar (1)' }),
      ).toBeEnabled();
    });

    it('un cliente sin viajeros lo dice y propone quitar el filtro', async () => {
      server.use(
        http.get(apiUrl('/api/travelers'), () =>
          HttpResponse.json(buildPage([])),
        ),
      );
      renderSection();
      const dialog = await openDialog();

      expect(
        await within(dialog).findByText(
          /todavía no tiene viajeros registrados/,
        ),
      ).toBeVisible();
    });
  });
});
