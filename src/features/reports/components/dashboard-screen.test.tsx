import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import type { components } from '@/lib/api/schema';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { DashboardScreen } from './dashboard-screen';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

type Dashboard = components['schemas']['Dashboard'];
type Commercial = components['schemas']['CommercialIndicators'];
type Financial = components['schemas']['FinancialIndicators'];

const board: Dashboard = {
  pending_requests: 3,
  quotes_draft: 2,
  quotes_sent: 4,
  quotes_expired: 1,
  follow_ups_red: 2,
  follow_ups_yellow: 5,
  bookings_to_request: 0,
  trips_next_30_days: 6,
  receivable: 4_500_000,
};

const commercial: Commercial = {
  requests_received: 12,
  quotes_created: 9,
  quotes_accepted: 3,
  quotes_rejected: 1,
  conversion_percent: '75.00',
  sales_count: 3,
  sales_amount: 9_000_000,
  average_ticket: 3_000_000,
  new_clients: 4,
  top_destinations: [{ label: 'Cartagena', count: 2, amount: 6_000_000 }],
  sales_by_advisor: [],
  sales_by_service_type: [{ label: 'Alojamiento', count: 5, amount: 0 }],
};

const financial: Financial = {
  sales_amount: 9_000_000,
  estimated_profit: 1_200_000,
  margin_percent: '13.33',
  income: 4_000_000,
  expenses: 4_050_000,
  net: -50_000,
  receivable: 4_500_000,
  payable: 800_000,
};

const render = (permissions: string[], overrides: Partial<Commercial> = {}) => {
  let financialCalls = 0;
  server.use(
    sessionHandler(buildSession({ permissions })),
    http.get(apiUrl('/api/reports/dashboard'), () => HttpResponse.json(board)),
    http.get(apiUrl('/api/reports/commercial'), () =>
      HttpResponse.json({ ...commercial, ...overrides }),
    ),
    http.get(apiUrl('/api/reports/financial'), () => {
      financialCalls += 1;
      return HttpResponse.json(financial);
    }),
  );
  renderWithProviders(
    <SessionGuard>
      <DashboardScreen />
    </SessionGuard>,
    { searchParams: { from: '2026-01-01', to: '2026-11-22' } },
  );
  return { financialCalls: () => financialCalls };
};

const tile = (label: string) => screen.getByText(label).closest('a, div');

describe('DashboardScreen', () => {
  it('muestra lo pendiente de hoy con enlaces a donde se atiende', async () => {
    render(['reports.view']);

    expect(await screen.findByText('Solicitudes por cotizar')).toBeVisible();
    expect(
      screen.getByText('Solicitudes por cotizar').closest('a'),
    ).toHaveAttribute('href', '/por-cotizar');
    expect(screen.getByText('Enviadas vencidas').closest('a')).toHaveAttribute(
      'href',
      '/cotizaciones?status=expired',
    );
    expect(screen.getByText('5 para hoy o mañana')).toBeVisible();
    expect(screen.getByText('Viajes en 30 días')).toBeVisible();
    expect(tile('Por cobrar a clientes')).toHaveTextContent(/4\.500\.000/);
  });

  it('muestra los indicadores comerciales del período', async () => {
    render(['reports.view']);

    expect(await screen.findByText('Solicitudes recibidas')).toBeVisible();
    expect(tile('Total vendido')).toHaveTextContent(/9\.000\.000/);
    expect(tile('Ticket promedio')).toHaveTextContent(/3\.000\.000/);
    expect(screen.getByText('3 aceptadas de 4 decididas')).toBeVisible();
    const destinations = screen.getByRole('heading', {
      name: 'Destinos más vendidos',
    }).parentElement as HTMLElement;
    expect(within(destinations).getByText('Cartagena')).toBeVisible();
  });

  it('un ranking sin datos lo dice y la conversión vacía va como raya', async () => {
    render(['reports.view'], {
      conversion_percent: null,
      average_ticket: null,
    });

    await screen.findByText('Solicitudes recibidas');

    expect(tile('Conversión')).toHaveTextContent('—');
    expect(tile('Ticket promedio')).toHaveTextContent('—');
    const advisors = screen.getByRole('heading', {
      name: 'Ventas por asesor',
    }).parentElement as HTMLElement;
    expect(
      within(advisors).getByText('Sin datos en el período.'),
    ).toBeVisible();
  });

  it('sin el permiso de finanzas no muestra ni pide los indicadores financieros', async () => {
    const calls = render(['reports.view']);

    await screen.findByText('Solicitudes recibidas');

    expect(
      screen.queryByRole('heading', { name: 'Indicadores financieros' }),
    ).not.toBeInTheDocument();
    expect(calls.financialCalls()).toBe(0);
  });

  it('con el permiso de finanzas muestra la ganancia y marca la caja en rojo', async () => {
    render(['reports.view', 'finance.view']);

    expect(
      await screen.findByRole('heading', { name: 'Indicadores financieros' }),
    ).toBeVisible();
    await waitFor(() =>
      expect(tile('Ganancia de lo vendido')).toHaveTextContent(/1\.200\.000/),
    );
    expect(screen.getByText('13,33 % de margen')).toBeVisible();
    expect(screen.getByText('Resultado de caja').closest('a')).toHaveAttribute(
      'href',
      '/finanzas',
    );
    expect(tile('Por pagar a proveedores')).toHaveTextContent(/800\.000/);
  });
});
