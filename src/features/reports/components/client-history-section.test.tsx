import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import type { components } from '@/lib/api/schema';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { ClientHistorySection } from './client-history-section';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

type ClientHistory = components['schemas']['ClientHistory'];

const history: ClientHistory = {
  requests: 1,
  quotes: 1,
  sales: 1,
  total_bought: 3_000_000,
  total_paid: 500_000,
  balance: 2_500_000,
  last_activity: '2026-11-20T15:00:00Z',
  events: [
    {
      kind: 'payment',
      at: '2026-11-20T17:00:00Z',
      record_id: 7,
      code: 'VEN-0007',
      title: 'Pago de la venta VEN-0007',
      status: 'transfer',
      amount: 500_000,
    },
    {
      kind: 'sale',
      at: '2026-11-18T15:00:00Z',
      record_id: 7,
      code: 'VEN-0007',
      title: 'Venta del viaje a Cartagena',
      status: 'partial',
      amount: 3_000_000,
    },
    {
      kind: 'request',
      at: '2026-11-10T15:00:00Z',
      record_id: 231,
      code: 'SOL-0231',
      title: 'Solicitud de viaje a Cartagena',
      status: 'quoted',
      amount: null,
    },
  ],
};

const render = (permissions: string[], response: () => Response) => {
  server.use(
    sessionHandler(buildSession({ permissions })),
    http.get(apiUrl('/api/reports/clients/21/history'), response),
  );
  renderWithProviders(
    <SessionGuard>
      <ClientHistorySection id="21" />
    </SessionGuard>,
  );
};

describe('ClientHistorySection', () => {
  it('resume lo comprado y lo que debe, y lista cada paso de más reciente a más viejo', async () => {
    render(['sales.view', 'travel_requests.view'], () =>
      HttpResponse.json(history),
    );

    expect(
      await screen.findByRole('heading', { name: 'Historial del cliente' }),
    ).toBeVisible();
    expect(
      screen.getByText('Saldo pendiente').nextElementSibling,
    ).toHaveTextContent(/2\.500\.000/);
    expect(screen.getByText('Con abonos')).toBeVisible();
    expect(screen.getByText('Transferencia')).toBeVisible();
    const titles = screen
      .getAllByRole('listitem')
      .map((item) => item.textContent ?? '');
    expect(titles[0]).toContain('Pago de la venta VEN-0007');
    expect(titles[2]).toContain('Solicitud de viaje a Cartagena');
  });

  it('enlaza cada paso solo si la persona puede abrirlo', async () => {
    render(['sales.view'], () => HttpResponse.json(history));

    expect(
      await screen.findByRole('link', { name: 'Venta del viaje a Cartagena' }),
    ).toHaveAttribute('href', '/ventas/7');
    expect(
      screen.queryByRole('link', { name: 'Solicitud de viaje a Cartagena' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Solicitud de viaje a Cartagena')).toBeVisible();
  });

  it('un cliente sin movimientos lo dice', async () => {
    render([], () =>
      HttpResponse.json({
        ...history,
        requests: 0,
        quotes: 0,
        sales: 0,
        total_bought: 0,
        total_paid: 0,
        balance: 0,
        last_activity: null,
        events: [],
      }),
    );

    expect(
      await screen.findByText(
        'Este cliente todavía no tiene solicitudes ni compras.',
      ),
    ).toBeVisible();
  });

  it('si falta algún permiso de lo que muestra, la sección no aparece', async () => {
    let asked = false;
    render(['clients.view'], () => {
      asked = true;
      return HttpResponse.json(
        { detail: 'No tienes permiso.', code: 'permission_denied', fields: {} },
        { status: 403 },
      );
    });

    await waitFor(() => expect(asked).toBe(true));

    expect(
      screen.queryByRole('heading', { name: 'Historial del cliente' }),
    ).not.toBeInTheDocument();
  });
});
