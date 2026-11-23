import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { buildPage } from '@/test/clients';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { buildQuoteListItem } from '@/test/quotes';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { QuotesScreen } from './quotes-screen';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

const render = (
  respond: (query: URLSearchParams) => Response,
  searchParams: Record<string, string> = {},
) => {
  const queries: URLSearchParams[] = [];
  server.use(
    sessionHandler(buildSession({ permissions: ['quotes.view'] })),
    http.get(apiUrl('/api/quotes'), ({ request }) => {
      const query = new URL(request.url).searchParams;
      queries.push(query);
      return respond(query);
    }),
  );
  renderWithProviders(
    <SessionGuard>
      <QuotesScreen />
    </SessionGuard>,
    { searchParams },
  );
  return queries;
};

const some = (items = [buildQuoteListItem()]) =>
  HttpResponse.json(buildPage(items));

const failure = (status: number) =>
  HttpResponse.json({ detail: 'Error', code: 'error', fields: {} }, { status });

describe('QuotesScreen', () => {
  it('lista las cotizaciones con su código, cliente y destino', async () => {
    render(() =>
      some([
        buildQuoteListItem(),
        buildQuoteListItem({
          id: 13,
          code: 'COT-0013',
          destination: 'Cartagena',
          client: { id: 8, display_name: 'Agencia Demostración SAS' },
        }),
      ]),
    );

    expect(
      await screen.findByRole('link', { name: /COT-0012/ }),
    ).toHaveAttribute('href', '/cotizaciones/12');
    const second = screen.getByRole('row', { name: /COT-0013/ });
    expect(second).toHaveTextContent('Agencia Demostración SAS');
    expect(second).toHaveTextContent('Cartagena');
  });

  it('sin cotizaciones explica cómo se crea la primera', async () => {
    render(() => some([]));

    expect(await screen.findByText('Aún no hay cotizaciones')).toBeVisible();
  });

  it('con filtros y sin resultados ofrece limpiarlos', async () => {
    const user = userEvent.setup();
    const queries = render(
      (query) => (query.get('status') ? some([]) : some()),
      { status: 'accepted' },
    );

    expect(
      await screen.findByText(
        'No hay cotizaciones que coincidan con la búsqueda',
      ),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));

    expect(await screen.findByRole('link', { name: /COT-0012/ })).toBeVisible();
    expect(queries.at(-1)?.get('status')).toBeNull();
  });

  it('filtrar por estado pide solo ese estado', async () => {
    const user = userEvent.setup();
    const queries = render(() => some());

    await screen.findByRole('link', { name: /COT-0012/ });
    await user.click(screen.getByRole('button', { name: 'Borradores' }));

    await waitFor(() =>
      expect(queries.some((query) => query.get('status') === 'draft')).toBe(
        true,
      ),
    );
    expect(queries[0].get('status')).toBeNull();
  });

  it('un estado desconocido en la URL se lee como todas', async () => {
    const queries = render(() => some(), { status: 'inventado' });

    await screen.findByRole('link', { name: /COT-0012/ });

    expect(queries[0].get('status')).toBeNull();
  });

  it('buscar pide la búsqueda al servidor', async () => {
    const user = userEvent.setup();
    const queries = render(() => some());

    await screen.findByRole('link', { name: /COT-0012/ });
    await user.type(screen.getByLabelText('Buscar cotización'), 'COT-0013');

    await waitFor(() =>
      expect(queries.some((query) => query.get('q') === 'COT-0013')).toBe(true),
    );
  });

  it('con más de una página ofrece la siguiente', async () => {
    const user = userEvent.setup();
    const queries = render(() =>
      HttpResponse.json(
        buildPage([buildQuoteListItem()], {
          count: 45,
          next: 'http://localhost:8000/api/quotes?page=2',
        }),
      ),
    );

    await screen.findByRole('link', { name: /COT-0012/ });
    await user.click(screen.getByRole('button', { name: /Siguiente/ }));

    await waitFor(() =>
      expect(queries.some((query) => query.get('page') === '2')).toBe(true),
    );
  });

  it('una página que ya no existe vuelve a la primera', async () => {
    const queries = render(
      (query) => (query.get('page') === '3' ? failure(404) : some()),
      { page: '3' },
    );

    expect(await screen.findByRole('link', { name: /COT-0012/ })).toBeVisible();
    expect(queries[0].get('page')).toBe('3');
    expect(queries.at(-1)?.get('page')).toBe('1');
  });

  it('sin permiso muestra que no hay acceso', async () => {
    render(() => failure(403));

    expect(
      await screen.findByText('No tienes acceso a esta sección'),
    ).toBeVisible();
  });

  it('un fallo del servidor se avisa y se puede reintentar', async () => {
    const user = userEvent.setup();
    let calls = 0;
    render(() => {
      calls += 1;
      return calls === 1 ? failure(500) : some();
    });

    expect(
      await screen.findByText('No pudimos cargar las cotizaciones'),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('link', { name: /COT-0012/ })).toBeVisible();
  });
});
