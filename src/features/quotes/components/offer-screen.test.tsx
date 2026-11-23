import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { buildPage } from '@/test/clients';
import type { components } from '@/lib/api/schema';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { OfferScreen } from './offer-screen';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

type OfferService = components['schemas']['OfferService'];

const hotel: OfferService = {
  id: 3,
  service_type: 'lodging',
  name: 'Habitación doble',
  destination: 'San Andrés',
  description: null,
  supplier: { id: 4, trade_name: 'Hotel Las Américas' },
  rates: [
    {
      id: 1,
      name: 'Temporada alta',
      currency: 'COP',
      charge_unit: 'per_night',
      amount: '450000',
      valid_from: '2026-12-01',
      valid_until: '2027-01-15',
    },
    {
      id: 2,
      name: 'En dólares',
      currency: 'USD',
      charge_unit: 'per_night',
      amount: '120.50',
      valid_from: '2026-12-01',
      valid_until: null,
    },
  ],
};

const render = (services: OfferService[]) => {
  const queries: URLSearchParams[] = [];
  server.use(
    sessionHandler(buildSession({ permissions: ['quotes.view'] })),
    http.get(apiUrl('/api/quotes/offer'), ({ request }) => {
      queries.push(new URL(request.url).searchParams);
      return HttpResponse.json(buildPage(services));
    }),
  );
  renderWithProviders(
    <SessionGuard>
      <OfferScreen />
    </SessionGuard>,
  );
  return queries;
};

describe('OfferScreen', () => {
  it('muestra cada servicio con su proveedor y las tarifas vigentes', async () => {
    render([hotel]);

    const card = (await screen.findByText('Habitación doble')).closest(
      'li',
    ) as HTMLElement;
    expect(within(card).getByText(/San Andrés/)).toBeVisible();
    expect(within(card).getByText('Hotel Las Américas')).toBeVisible();
    expect(within(card).getByText(/Temporada alta \(hasta/)).toBeVisible();
    expect(within(card).getByText(/450\.000/)).toBeVisible();
    expect(within(card).getByText(/120,50/)).toBeVisible();
  });

  it('un servicio sin tarifas vigentes lo dice', async () => {
    render([{ ...hotel, rates: [] }]);

    expect(await screen.findByText('Sin tarifas vigentes.')).toBeVisible();
  });

  it('sin resultados lo dice', async () => {
    render([]);

    expect(await screen.findByText('Sin resultados')).toBeVisible();
  });

  it('buscar y filtrar por tipo piden eso al servidor', async () => {
    const user = userEvent.setup();
    const queries = render([hotel]);

    await screen.findByText('Habitación doble');
    await user.type(screen.getByLabelText('Buscar en la oferta'), 'lancha');
    await waitFor(() =>
      expect(queries.some((query) => query.get('q') === 'lancha')).toBe(true),
    );

    await user.selectOptions(
      screen.getByLabelText('Tipo de servicio'),
      'lodging',
    );
    await waitFor(() =>
      expect(
        queries.some((query) => query.get('service_type') === 'lodging'),
      ).toBe(true),
    );
  });
});
