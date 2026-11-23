import { screen, waitFor } from '@testing-library/react';
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
  describe('aviso de costos incompletos', () => {
    const NOTICE = 'El costo real registrado es menor que el estimado.';

    const renderWith = (profitability: Profitability) => {
      server.use(
        sessionHandler(buildSession({ permissions: ['finance.view'] })),
        http.get(apiUrl('/api/sales/3/profitability'), () =>
          HttpResponse.json(profitability),
        ),
      );
      renderWithProviders(
        <SessionGuard>
          <SaleFinanceSection saleId={3} />
        </SessionGuard>,
      );
    };

    const withActual = (actual: number): Profitability => ({
      ...estimate,
      actual_cost: actual,
      uses_actual_cost: true,
      cost_difference: actual - estimate.estimated_cost,
      profit: estimate.sale_price - actual,
    });

    it('avisa cuando el costo real registrado es menor que el estimado', async () => {
      renderWith(withActual(1_000_000));

      expect(await screen.findByText(NOTICE)).toBeVisible();
    });

    it('no avisa cuando el costo real iguala o supera al estimado', async () => {
      renderWith(withActual(2_600_000));

      expect(await screen.findByText('Costo real')).toBeVisible();
      expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
    });

    it('no avisa mientras la rentabilidad usa el costo estimado', async () => {
      renderWith(estimate);

      expect(await screen.findByText('Con el costo estimado')).toBeVisible();
      expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
    });
  });
  describe('costos reales', () => {
    const hotel = {
      id: 1,
      description: 'Hotel',
      supplier: null,
      amount: 2_700_000,
      paid_on: null,
    };
    const withHotel: Profitability = {
      ...estimate,
      actual_cost: 2_700_000,
      owed_to_suppliers: 2_700_000,
      profit: 300_000,
      uses_actual_cost: true,
      cost_difference: 100_000,
      costs: [hotel],
    };

    const render = (permissions: string[], data: Profitability) => {
      let current = data;
      const calls: { method: string; path: string; body?: unknown }[] = [];
      server.use(
        sessionHandler(buildSession({ permissions })),
        http.get(apiUrl('/api/sales/3/profitability'), () => {
          calls.push({ method: 'GET', path: 'profitability' });
          return HttpResponse.json(current);
        }),
        http.put(apiUrl('/api/costs/1'), async ({ request }) => {
          calls.push({
            method: 'PUT',
            path: 'cost',
            body: await request.json(),
          });
          current = {
            ...data,
            owed_to_suppliers: 0,
            paid_to_suppliers: 2_700_000,
            costs: [{ ...hotel, paid_on: '2026-11-22' }],
          };
          return HttpResponse.json(current);
        }),
        http.delete(apiUrl('/api/costs/1'), () => {
          calls.push({ method: 'DELETE', path: 'cost' });
          current = estimate;
          return HttpResponse.json(current);
        }),
      );
      renderWithProviders(
        <SessionGuard>
          <SaleFinanceSection saleId={3} />
        </SessionGuard>,
      );
      return calls;
    };

    it('marca un costo adeudado como pagado hoy', async () => {
      const user = userEvent.setup();
      const calls = render(['finance.view', 'finance.manage'], withHotel);

      await user.click(
        await screen.findByRole('button', { name: 'Marcar pagado hoy' }),
      );

      expect(await screen.findByText(/^Pagado el \d/)).toBeVisible();
      const put = calls.find((call) => call.method === 'PUT');
      expect(put?.body).toMatchObject({
        description: 'Hotel',
        supplier_id: null,
        amount: 2_700_000,
        paid_on: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      });
      expect(
        screen.queryByRole('button', { name: 'Marcar pagado hoy' }),
      ).not.toBeInTheDocument();
    });

    it('quita un costo y vuelve a usar el estimado', async () => {
      const user = userEvent.setup();
      const calls = render(['finance.view', 'finance.manage'], withHotel);

      await user.click(await screen.findByRole('button', { name: 'Quitar' }));

      expect(await screen.findByText('Con el costo estimado')).toBeVisible();
      expect(calls.some((call) => call.method === 'DELETE')).toBe(true);
      expect(screen.queryByText('Hotel')).not.toBeInTheDocument();
    });

    it('sin permiso de gestión se ven los costos pero no se cambian', async () => {
      render(['finance.view'], withHotel);

      expect(await screen.findByText('Hotel')).toBeVisible();
      expect(
        screen.queryByRole('button', { name: 'Quitar' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Agregar costo' }),
      ).not.toBeInTheDocument();
    });

    it('sin permiso de finanzas no se muestra ni se pide nada', async () => {
      const calls = render(['sales.view'], withHotel);

      await waitFor(() => expect(screen.queryByRole('region')).toBeNull());

      expect(calls).toEqual([]);
    });

    it('pide qué se pagó y un valor válido antes de enviar', async () => {
      const user = userEvent.setup();
      const calls = render(['finance.view', 'finance.manage'], estimate);

      await user.click(
        await screen.findByRole('button', { name: 'Agregar costo' }),
      );
      expect(await screen.findByText('Indica qué se pagó.')).toBeVisible();

      await user.type(screen.getByLabelText('Costo real'), 'Hotel');
      await user.type(screen.getByLabelText('Valor (COP)'), 'mucho');
      await user.click(screen.getByRole('button', { name: 'Agregar costo' }));

      await waitFor(() =>
        expect(
          screen.queryByText('Indica qué se pagó.'),
        ).not.toBeInTheDocument(),
      );
      expect(screen.getByRole('alert')).toBeVisible();
      expect(calls.some((call) => call.method === 'POST')).toBe(false);
    });

    it('muestra el motivo si el servidor rechaza el costo', async () => {
      const user = userEvent.setup();
      render(['finance.view', 'finance.manage'], estimate);
      server.use(
        http.post(apiUrl('/api/sales/3/costs'), () =>
          HttpResponse.json(
            { detail: 'El proveedor no existe.', code: 'conflict', fields: {} },
            { status: 409 },
          ),
        ),
      );

      await screen.findByRole('button', { name: 'Agregar costo' });
      await user.type(screen.getByLabelText('Costo real'), 'Hotel');
      await user.type(screen.getByLabelText('Valor (COP)'), '100.000');
      await user.click(screen.getByRole('button', { name: 'Agregar costo' }));

      expect(await screen.findByText('El proveedor no existe.')).toBeVisible();
    });
  });
});
