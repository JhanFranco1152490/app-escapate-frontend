import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import type { components } from '@/lib/api/schema';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { ExpensesSection } from './expenses-section';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

type Expense = components['schemas']['ExpenseOut'];

const PERIOD = { from: '2026-01-01', to: '2026-11-22' };

const rent: Expense = {
  id: 1,
  spent_on: '2026-11-03',
  category: 'rent',
  description: 'Arriendo de la oficina',
  amount: 1_800_000,
  created_by: { id: 1, full_name: 'Persona de Prueba' },
};

const page = (results: Expense[]) => ({
  count: results.length,
  next: null,
  previous: null,
  results,
});

const render = (permissions: string[], expenses: Expense[]) => {
  let current = expenses;
  const requests: { method: string; body?: unknown; path: string }[] = [];
  server.use(
    sessionHandler(buildSession({ permissions })),
    http.get(apiUrl('/api/expenses'), ({ request }) => {
      requests.push({ method: 'GET', path: new URL(request.url).search });
      return HttpResponse.json(page(current));
    }),
    http.post(apiUrl('/api/expenses'), async ({ request }) => {
      const body = (await request.json()) as Omit<Expense, 'id' | 'created_by'>;
      requests.push({ method: 'POST', body, path: '' });
      current = [...current, { ...body, id: 9, created_by: rent.created_by }];
      return HttpResponse.json(current.at(-1), { status: 201 });
    }),
    http.delete(apiUrl('/api/expenses/:id'), ({ params }) => {
      requests.push({ method: 'DELETE', path: String(params.id) });
      current = current.filter((expense) => expense.id !== Number(params.id));
      return new HttpResponse(null, { status: 204 });
    }),
  );
  renderWithProviders(
    <SessionGuard>
      <ExpensesSection period={PERIOD} />
    </SessionGuard>,
  );
  return requests;
};

describe('ExpensesSection', () => {
  it('lista los gastos del período con su categoría y valor', async () => {
    const requests = render(['finance.view'], [rent]);

    expect(await screen.findByText('Arriendo de la oficina')).toBeVisible();
    expect(screen.getByText('Arriendo')).toBeVisible();
    expect(screen.getByText(/1\.800\.000/)).toBeVisible();
    expect(requests[0].path).toContain('date_from=2026-01-01');
    expect(requests[0].path).toContain('date_to=2026-11-22');
  });

  it('sin permiso de gestión no se puede quitar ni registrar', async () => {
    render(['finance.view'], [rent]);

    await screen.findByText('Arriendo de la oficina');

    expect(
      screen.queryByRole('button', { name: 'Quitar' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Registrar gasto' }),
    ).not.toBeInTheDocument();
  });

  it('sin gastos lo dice', async () => {
    render(['finance.view'], []);

    expect(
      await screen.findByText('No hay gastos registrados en este período.'),
    ).toBeVisible();
  });

  it('registra un gasto y lo muestra en la lista', async () => {
    const user = userEvent.setup();
    const requests = render(['finance.view', 'finance.manage'], []);

    await screen.findByText('No hay gastos registrados en este período.');
    fireEvent.change(screen.getByLabelText('Fecha'), {
      target: { value: '2026-11-10' },
    });
    await user.selectOptions(screen.getByLabelText('Categoría'), 'Nómina');
    await user.type(
      screen.getByLabelText('Descripción'),
      '  Nómina de noviembre ',
    );
    await user.type(screen.getByLabelText('Valor (COP)'), '4.200.000');
    await user.click(screen.getByRole('button', { name: 'Registrar gasto' }));

    expect(await screen.findByText('Nómina de noviembre')).toBeVisible();
    expect(requests.find((r) => r.method === 'POST')?.body).toEqual({
      spent_on: '2026-11-10',
      category: 'payroll',
      description: 'Nómina de noviembre',
      amount: 4_200_000,
    });
    expect(screen.getByLabelText('Descripción')).toHaveValue('');
    expect(screen.getByLabelText('Valor (COP)')).toHaveValue('');
  });

  it('pide la descripción y un valor válido antes de enviar', async () => {
    const user = userEvent.setup();
    const requests = render(['finance.view', 'finance.manage'], []);

    await screen.findByText('No hay gastos registrados en este período.');
    await user.click(screen.getByRole('button', { name: 'Registrar gasto' }));
    expect(await screen.findByText('Indica en qué se gastó.')).toBeVisible();

    await user.type(screen.getByLabelText('Descripción'), 'Arriendo');
    await user.type(screen.getByLabelText('Valor (COP)'), 'mucho');
    await user.click(screen.getByRole('button', { name: 'Registrar gasto' }));

    await waitFor(() =>
      expect(
        screen.queryByText('Indica en qué se gastó.'),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('alert')).toBeVisible();
    expect(requests.some((request) => request.method === 'POST')).toBe(false);
  });

  it('muestra el motivo si el servidor rechaza el gasto', async () => {
    const user = userEvent.setup();
    render(['finance.view', 'finance.manage'], []);
    server.use(
      http.post(apiUrl('/api/expenses'), () =>
        HttpResponse.json(
          {
            detail: 'No se pudo registrar el gasto.',
            code: 'conflict',
            fields: {},
          },
          { status: 409 },
        ),
      ),
    );

    await screen.findByText('No hay gastos registrados en este período.');
    await user.type(screen.getByLabelText('Descripción'), 'Arriendo');
    await user.type(screen.getByLabelText('Valor (COP)'), '100.000');
    await user.click(screen.getByRole('button', { name: 'Registrar gasto' }));

    expect(
      await screen.findByText('No se pudo registrar el gasto.'),
    ).toBeVisible();
  });

  it('quita un gasto y desaparece de la lista', async () => {
    const user = userEvent.setup();
    const requests = render(['finance.view', 'finance.manage'], [rent]);

    await screen.findByText('Arriendo de la oficina');
    await user.click(screen.getByRole('button', { name: 'Quitar' }));

    await waitFor(() =>
      expect(
        screen.queryByText('Arriendo de la oficina'),
      ).not.toBeInTheDocument(),
    );
    expect(requests.find((r) => r.method === 'DELETE')?.path).toBe('1');
  });
});
