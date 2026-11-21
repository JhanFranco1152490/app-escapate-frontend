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

import { SaleFinanceSection } from './sale-finance-section';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

type Profitability = components['schemas']['Profitability'];

const estimate: Profitability = {
  sale_price: 3_000_000,
  estimated_cost: 2_600_000,
  actual_cost: 0,
  paid_to_suppliers: 0,
  owed_to_suppliers: 0,
  profit: 400_000,
  margin_percent: '13.33',
  uses_actual_cost: false,
  cost_difference: 0,
  costs: [],
};

describe('SaleFinanceSection', () => {
  it('usa el costo estimado y registra un costo real adeudado', async () => {
    const user = userEvent.setup();
    let body: unknown;
    let current = estimate;
    server.use(
      sessionHandler(
        buildSession({ permissions: ['finance.view', 'finance.manage'] }),
      ),
      http.get(apiUrl('/api/sales/3/profitability'), () =>
        HttpResponse.json(current),
      ),
      http.post(apiUrl('/api/sales/3/costs'), async ({ request }) => {
        body = await request.json();
        current = {
          ...estimate,
          actual_cost: 2_700_000,
          owed_to_suppliers: 2_700_000,
          profit: 300_000,
          margin_percent: '10.00',
          uses_actual_cost: true,
          cost_difference: 100_000,
          costs: [
            {
              id: 1,
              description: 'Hotel',
              supplier: null,
              amount: 2_700_000,
              paid_on: null,
            },
          ],
        };
        return HttpResponse.json(current, { status: 201 });
      }),
    );
    renderWithProviders(
      <SessionGuard>
        <SaleFinanceSection saleId={3} />
      </SessionGuard>,
    );

    expect(await screen.findByText('Con el costo estimado')).toBeVisible();
    await user.type(screen.getByLabelText('Costo real'), 'Hotel');
    await user.type(screen.getByLabelText('Valor (COP)'), '2.700.000');
    await user.click(screen.getByRole('button', { name: 'Agregar costo' }));

    expect(await screen.findByText('Adeudado al proveedor')).toBeVisible();
    expect(body).toEqual({
      description: 'Hotel',
      amount: 2_700_000,
      paid_on: null,
    });
  });
});
