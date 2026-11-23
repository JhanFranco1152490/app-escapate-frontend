import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import type { components } from '@/lib/api/schema';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { FinanceScreen } from './finance-screen';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

type Summary = components['schemas']['FinanceSummary'];

const summary: Summary = {
  income: 4_000_000,
  supplier_payments: 2_500_000,
  operating_expenses: 1_550_000,
  expenses: 4_050_000,
  net: -50_000,
  by_month: [
    {
      month: '2026-10',
      income: 1_000_000,
      supplier_payments: 500_000,
      operating_expenses: 300_000,
      net: 200_000,
    },
    {
      month: '2026-11',
      income: 3_000_000,
      supplier_payments: 2_000_000,
      operating_expenses: 1_250_000,
      net: -250_000,
    },
  ],
  by_category: { rent: 1_800_000, payroll: 0 },
};

const render = (data: Summary = summary) => {
  const queries: URLSearchParams[] = [];
  server.use(
    sessionHandler(buildSession({ permissions: ['finance.view'] })),
    http.get(apiUrl('/api/finance/summary'), ({ request }) => {
      queries.push(new URL(request.url).searchParams);
      return HttpResponse.json(data);
    }),
    http.get(apiUrl('/api/expenses'), () =>
      HttpResponse.json({ count: 0, next: null, previous: null, results: [] }),
    ),
  );
  renderWithProviders(
    <SessionGuard>
      <FinanceScreen />
    </SessionGuard>,
    { searchParams: { from: '2026-01-01', to: '2026-11-22' } },
  );
  return queries;
};

describe('FinanceScreen', () => {
  it('muestra los totales del período y marca un resultado negativo', async () => {
    render();

    const totals = (
      await screen.findByRole('heading', { name: 'Totales del período' })
    ).parentElement as HTMLElement;
    expect(
      within(totals).getByText('Ingresos').nextElementSibling,
    ).toHaveTextContent(/4\.000\.000/);
    expect(
      within(totals).getByText('Pagos a proveedores').nextElementSibling,
    ).toHaveTextContent(/2\.500\.000/);
    const result = within(totals).getByText('Resultado')
      .nextElementSibling as HTMLElement;
    expect(within(result).getByText(/50\.000/)).toHaveClass('text-destructive');
  });

  it('desglosa por mes, con el mes escrito en español', async () => {
    render();

    const months = (await screen.findByRole('heading', { name: 'Por mes' }))
      .parentElement as HTMLElement;
    expect(within(months).getByText('oct 2026')).toBeVisible();
    const november = within(months).getByRole('row', { name: /nov 2026/ });
    expect(within(november).getByText(/3\.000\.000/)).toBeVisible();
  });

  it('muestra los gastos por categoría con su nombre', async () => {
    render();

    const categories = (
      await screen.findByRole('heading', { name: 'Gastos por categoría' })
    ).parentElement as HTMLElement;
    expect(
      within(categories).getByText('Arriendo').nextElementSibling,
    ).toHaveTextContent(/1\.800\.000/);
    expect(within(categories).getByText('Nómina')).toBeVisible();
  });

  it('sin movimientos en el período lo dice', async () => {
    render({ ...summary, by_month: [], by_category: {} });

    expect(
      await screen.findByText('No hay movimientos en este período.'),
    ).toBeVisible();
  });

  it('cambiar el período vuelve a pedir el resumen con las nuevas fechas', async () => {
    const queries = render();

    await screen.findByRole('heading', { name: 'Por mes' });
    fireEvent.change(screen.getByLabelText('Desde'), {
      target: { value: '2026-10-01' },
    });

    await waitFor(() =>
      expect(
        queries.some((query) => query.get('date_from') === '2026-10-01'),
      ).toBe(true),
    );
    expect(queries[0].get('date_to')).toBe('2026-11-22');
  });
});
