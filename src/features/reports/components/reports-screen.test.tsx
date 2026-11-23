import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import type { components } from '@/lib/api/schema';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { downloadCsv } from '../csv';
import { ReportsScreen } from './reports-screen';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('../csv', () => ({ downloadCsv: vi.fn() }));

type Report = components['schemas']['Report'];

const PERIOD = { from: '2026-01-01', to: '2026-11-22' };

const salesReport: Report = {
  title: 'Ventas',
  columns: ['Código', 'Cliente', 'Total', 'Saldo'],
  rows: [
    ['VEN-0001', 'Marta Zapatoca', 3_000_000, 1_200_000],
    ['VEN-0002', 'Agencia Demostración SAS', 950_000, null],
  ],
};

const render = (
  permissions: string[],
  searchParams: Record<string, string> = {},
) => {
  server.use(sessionHandler(buildSession({ permissions })));
  renderWithProviders(
    <SessionGuard>
      <ReportsScreen />
    </SessionGuard>,
    { searchParams: { ...PERIOD, ...searchParams } },
  );
};

beforeEach(() => {
  vi.mocked(downloadCsv).mockClear();
});

describe('ReportsScreen', () => {
  it('muestra las filas con el dinero en pesos y lo vacío como raya', async () => {
    server.use(
      http.get(apiUrl('/api/reports/sales'), () =>
        HttpResponse.json(salesReport),
      ),
    );
    render(['reports.view']);

    expect(await screen.findByText('Ventas: 2 registros')).toBeVisible();
    const row = screen.getByRole('row', { name: /VEN-0001/ });
    expect(within(row).getByText('Marta Zapatoca')).toBeVisible();
    expect(within(row).getByText(/3\.000\.000/)).toBeVisible();
    expect(
      within(screen.getByRole('row', { name: /VEN-0002/ })).getByText('—'),
    ).toBeVisible();
  });

  it('pide el reporte del período elegido', async () => {
    let query: URLSearchParams | undefined;
    server.use(
      http.get(apiUrl('/api/reports/sales'), ({ request }) => {
        query = new URL(request.url).searchParams;
        return HttpResponse.json(salesReport);
      }),
    );
    render(['reports.view']);

    await screen.findByText('Ventas: 2 registros');

    expect(query?.get('date_from')).toBe(PERIOD.from);
    expect(query?.get('date_to')).toBe(PERIOD.to);
  });

  it('exporta lo que se ve a un archivo con el tipo y el período en el nombre', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(apiUrl('/api/reports/sales'), () =>
        HttpResponse.json(salesReport),
      ),
    );
    render(['reports.view']);

    await screen.findByText('Ventas: 2 registros');
    await user.click(screen.getByRole('button', { name: 'Exportar CSV' }));

    expect(downloadCsv).toHaveBeenCalledWith(
      salesReport,
      'sales-2026-01-01-a-2026-11-22.csv',
    );
  });

  it('sin registros avisa y no deja exportar', async () => {
    server.use(
      http.get(apiUrl('/api/reports/sales'), () =>
        HttpResponse.json({ ...salesReport, rows: [] }),
      ),
    );
    render(['reports.view']);

    expect(await screen.findByText('Sin datos')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Exportar CSV' })).toBeDisabled();
  });

  it('cambiar de pestaña pide otro tipo de reporte', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(apiUrl('/api/reports/sales'), () =>
        HttpResponse.json(salesReport),
      ),
      http.get(apiUrl('/api/reports/payments'), () =>
        HttpResponse.json({
          title: 'Pagos de clientes',
          columns: ['Venta', 'Valor'],
          rows: [['VEN-0001', 500_000]],
        }),
      ),
    );
    render(['reports.view']);

    await screen.findByText('Ventas: 2 registros');
    await user.click(screen.getByRole('button', { name: 'Pagos de clientes' }));

    expect(
      await screen.findByText('Pagos de clientes: 1 registros'),
    ).toBeVisible();
  });

  describe('gastos operativos', () => {
    it('la pestaña solo está con el permiso de finanzas', async () => {
      server.use(
        http.get(apiUrl('/api/reports/sales'), () =>
          HttpResponse.json(salesReport),
        ),
      );
      render(['reports.view']);

      await screen.findByText('Ventas: 2 registros');

      expect(
        screen.queryByRole('button', { name: 'Gastos operativos' }),
      ).not.toBeInTheDocument();
    });

    it('con el permiso de finanzas la pestaña está', async () => {
      server.use(
        http.get(apiUrl('/api/reports/sales'), () =>
          HttpResponse.json(salesReport),
        ),
      );
      render(['reports.view', 'finance.view']);

      expect(
        await screen.findByRole('button', { name: 'Gastos operativos' }),
      ).toBeVisible();
    });

    it('entrar por la URL sin el permiso muestra que no hay acceso, no una carga eterna', async () => {
      server.use(
        http.get(apiUrl('/api/reports/expenses'), () =>
          HttpResponse.json(
            {
              detail: 'No tienes permiso.',
              code: 'permission_denied',
              fields: {},
            },
            { status: 403 },
          ),
        ),
      );
      render(['reports.view'], { kind: 'expenses' });

      expect(
        await screen.findByText('No tienes acceso a esta sección'),
      ).toBeVisible();
      expect(
        screen.queryByText('Generando el reporte'),
      ).not.toBeInTheDocument();
    });
  });

  it('un fallo del servidor se avisa y se puede reintentar', async () => {
    const user = userEvent.setup();
    let calls = 0;
    server.use(
      http.get(apiUrl('/api/reports/sales'), () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json(
              { detail: 'Error', code: 'internal_error', fields: {} },
              { status: 500 },
            )
          : HttpResponse.json(salesReport);
      }),
    );
    render(['reports.view']);

    expect(
      await screen.findByText('No pudimos generar el reporte'),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Ventas: 2 registros')).toBeVisible();
  });
});
