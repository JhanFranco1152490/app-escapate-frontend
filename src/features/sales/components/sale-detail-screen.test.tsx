import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import type { components } from '@/lib/api/schema';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { SaleDetailScreen } from './sale-detail-screen';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

type SaleDetail = components['schemas']['SaleDetail'];

const sale = (overrides: Partial<SaleDetail> = {}): SaleDetail => ({
  id: 3,
  code: 'VEN-0003',
  quote: { id: 12, code: 'COT-0012' },
  client: { id: 7, display_name: 'Marcela Gómez Ortiz' },
  destination: 'San Andrés',
  departure_date: '2026-12-18',
  return_date: '2026-12-24',
  total_price: 3_000_000,
  paid: 0,
  balance: 3_000_000,
  payment_status: 'pending',
  created_at: '2026-11-20T15:00:00Z',
  adults: 2,
  minors: 1,
  total_cost: 2_600_000,
  notes: null,
  created_by: { id: 2, full_name: 'Andrés Peña' },
  payments: [],
  ...overrides,
});

const renderScreen = () => {
  server.use(
    sessionHandler(
      buildSession({ permissions: ['sales.view', 'sales.manage'] }),
    ),
    http.get(apiUrl('/api/sales/3'), () => HttpResponse.json(sale())),
  );
  renderWithProviders(
    <SessionGuard>
      <SaleDetailScreen id="3" />
    </SessionGuard>,
  );
};

describe('SaleDetailScreen', () => {
  it('registra un abono y muestra el nuevo saldo', async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      http.post(apiUrl('/api/sales/3/payments'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          sale({
            paid: 1_000_000,
            balance: 2_000_000,
            payment_status: 'partial',
            payments: [
              {
                id: 1,
                amount: 1_000_000,
                paid_on: '2026-11-20',
                method: 'transfer',
                reference: 'ABC123',
                notes: null,
                created_by: { id: 2, full_name: 'Andrés Peña' },
                created_at: '2026-11-20T16:00:00Z',
              },
            ],
          }),
          { status: 201 },
        );
      }),
    );
    renderScreen();

    await screen.findByRole('heading', { name: 'Venta VEN-0003' });
    await user.type(screen.getByLabelText('Valor (COP)'), '1.000.000');
    await user.type(screen.getByLabelText('Referencia'), 'ABC123');
    await user.click(screen.getByRole('button', { name: 'Registrar pago' }));

    expect(await screen.findByText('Pago registrado.')).toBeVisible();
    expect(body).toMatchObject({
      amount: 1_000_000,
      method: 'transfer',
      reference: 'ABC123',
    });
    expect(screen.getByText('Con abonos')).toBeVisible();
  });

  it('dice cuando el pago pasa del saldo', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(apiUrl('/api/sales/3/payments'), () =>
        HttpResponse.json(
          {
            detail: 'Revisa los datos enviados.',
            code: 'validation_error',
            fields: { amount: ['El pago supera el saldo pendiente.'] },
          },
          { status: 422 },
        ),
      ),
    );
    renderScreen();

    await screen.findByRole('heading', { name: 'Venta VEN-0003' });
    await user.type(screen.getByLabelText('Valor (COP)'), '9.000.000');
    await user.click(screen.getByRole('button', { name: 'Registrar pago' }));

    expect(
      await screen.findByText('El pago supera el saldo pendiente.'),
    ).toBeVisible();
  });
});
