import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { buildPage } from '@/test/clients';
import { buildQuoteDetail, buildQuoteListItem } from '@/test/quotes';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { RequestQuotesSection } from './request-quotes-section';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

const renderSection = (permissions: string[], closed = false) => {
  server.use(
    sessionHandler(buildSession({ permissions })),
    http.get(apiUrl('/api/quotes'), ({ request }) => {
      const requestId = new URL(request.url).searchParams.get(
        'travel_request_id',
      );
      return HttpResponse.json(
        buildPage(
          requestId === '231' ? [buildQuoteListItem({ status: 'sent' })] : [],
        ),
      );
    }),
  );
  renderWithProviders(
    <SessionGuard>
      <RequestQuotesSection requestId={231} closed={closed} />
    </SessionGuard>,
  );
};

describe('RequestQuotesSection', () => {
  it('lista las cotizaciones de la solicitud', async () => {
    renderSection(['quotes.view']);

    expect(
      await screen.findByRole('link', { name: 'COT-0012' }),
    ).toHaveAttribute('href', '/cotizaciones/12');
    expect(
      screen.queryByRole('button', { name: 'Crear cotización' }),
    ).toBeNull();
  });

  it('crea una cotización y lleva a ella', async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      http.post(apiUrl('/api/quotes'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(buildQuoteDetail({ id: 13 }), { status: 201 });
      }),
    );
    renderSection(['quotes.view', 'quotes.manage']);

    await user.click(
      await screen.findByRole('button', { name: 'Crear cotización' }),
    );

    expect(body).toEqual({ travel_request_id: 231 });
    expect(push).toHaveBeenCalledWith('/cotizaciones/13');
  });

  it('una solicitud cerrada no se cotiza', async () => {
    renderSection(['quotes.view', 'quotes.manage'], true);

    await screen.findByRole('link', { name: 'COT-0012' });
    expect(
      screen.queryByRole('button', { name: 'Crear cotización' }),
    ).toBeNull();
  });

  it('sin permiso de ver cotizaciones no se muestra', () => {
    renderSection(['travel_requests.view']);

    expect(screen.queryByRole('heading', { name: 'Cotizaciones' })).toBeNull();
  });
});
