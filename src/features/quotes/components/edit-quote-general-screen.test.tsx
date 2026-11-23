import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { buildQuoteDetail } from '@/test/quotes';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import type { QuoteDetail } from '../api';
import { EditQuoteGeneralScreen } from './edit-quote-general-screen';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push }),
}));

beforeEach(() => push.mockClear());

const failure = (status: number, code: string, detail: string, fields = {}) =>
  HttpResponse.json({ detail, code, fields }, { status });

const render = (quote: QuoteDetail = buildQuoteDetail()) => {
  server.use(
    sessionHandler(
      buildSession({ permissions: ['quotes.view', 'quotes.manage'] }),
    ),
    http.get(apiUrl('/api/quotes/12'), () => HttpResponse.json(quote)),
  );
  renderWithProviders(
    <SessionGuard>
      <EditQuoteGeneralScreen id="12" />
    </SessionGuard>,
  );
};

const save = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

describe('EditQuoteGeneralScreen', () => {
  it('abre el formulario con los datos de la cotización', async () => {
    render();

    expect(await screen.findByLabelText(/Destino/)).toHaveValue('San Andrés');
    expect(
      screen.getByRole('heading', { name: 'Datos generales · COT-0012' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute(
      'href',
      '/cotizaciones/12',
    );
  });

  it('guarda con la versión con la que se abrió y vuelve a la ficha', async () => {
    const user = userEvent.setup();
    let body: unknown;
    render();
    server.use(
      http.put(apiUrl('/api/quotes/12'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(buildQuoteDetail({ version: 2 }));
      }),
    );

    const destination = await screen.findByLabelText(/Destino/);
    await user.clear(destination);
    await user.type(destination, 'Cartagena');
    await save(user);

    await vi.waitFor(() =>
      expect(push).toHaveBeenCalledWith('/cotizaciones/12'),
    );
    expect(body).toMatchObject({
      destination: 'Cartagena',
      expected_version: 1,
    });
  });

  it('no deja guardar sin destino y dice qué falta', async () => {
    const user = userEvent.setup();
    const puts = vi.fn();
    render();
    server.use(
      http.put(apiUrl('/api/quotes/12'), () => {
        puts();
        return HttpResponse.json(buildQuoteDetail());
      }),
    );

    await user.clear(await screen.findByLabelText(/Destino/));
    await save(user);

    expect(await screen.findByRole('alert')).toBeVisible();
    expect(puts).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it('muestra en el campo el error que devuelve la API', async () => {
    const user = userEvent.setup();
    render();
    server.use(
      http.put(apiUrl('/api/quotes/12'), () =>
        failure(422, 'validation_error', 'Datos inválidos', {
          valid_until: ['La vigencia ya pasó.'],
        }),
      ),
    );

    await screen.findByLabelText(/Destino/);
    await save(user);

    expect(await screen.findByText('La vigencia ya pasó.')).toBeVisible();
    expect(push).not.toHaveBeenCalled();
  });

  it('un fallo sin campos avisa que no se pudo guardar', async () => {
    const user = userEvent.setup();
    render();
    server.use(
      http.put(apiUrl('/api/quotes/12'), () =>
        failure(500, 'internal_error', 'Error'),
      ),
    );

    await screen.findByLabelText(/Destino/);
    await save(user);

    expect(
      await screen.findByText(
        'No pudimos guardar la cotización. Inténtalo de nuevo.',
      ),
    ).toBeVisible();
  });

  it('si otra persona guardó antes avisa y deja recargar sin perder lo escrito', async () => {
    const user = userEvent.setup();
    render();
    server.use(
      http.put(apiUrl('/api/quotes/12'), () =>
        failure(409, 'stale_version', 'Alguien más cambió esta cotización.'),
      ),
    );

    const destination = await screen.findByLabelText(/Destino/);
    await user.clear(destination);
    await user.type(destination, 'Cartagena');
    await save(user);

    expect(
      await screen.findByText('Alguien más cambió esta cotización.'),
    ).toBeVisible();
    expect(screen.getByLabelText(/Destino/)).toHaveValue('Cartagena');

    server.use(
      http.get(apiUrl('/api/quotes/12'), () =>
        HttpResponse.json(
          buildQuoteDetail({ destination: 'Medellín', version: 2 }),
        ),
      ),
    );
    await user.click(screen.getByRole('button', { name: 'Recargar' }));

    await vi.waitFor(() =>
      expect(screen.getByLabelText(/Destino/)).toHaveValue('Medellín'),
    );
    expect(
      screen.queryByText('Alguien más cambió esta cotización.'),
    ).not.toBeInTheDocument();
  });

  it('si la cotización dejó de ser borrador mientras se editaba lo avisa', async () => {
    const user = userEvent.setup();
    render();
    server.use(
      http.put(apiUrl('/api/quotes/12'), () =>
        failure(
          409,
          'quote_not_editable',
          'Solo se edita una cotización en borrador.',
        ),
      ),
    );

    await screen.findByLabelText(/Destino/);
    await save(user);

    expect(
      await screen.findByText('Solo se edita una cotización en borrador.'),
    ).toBeVisible();
    expect(push).not.toHaveBeenCalled();
  });

  it('una cotización enviada no se edita y manda a la ficha', async () => {
    render(
      buildQuoteDetail({ status: 'sent', sent_at: '2026-11-20T16:00:00Z' }),
    );

    expect(
      await screen.findByText(/Solo se edita una cotización en borrador/),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Ir a la ficha' })).toHaveAttribute(
      'href',
      '/cotizaciones/12',
    );
    expect(screen.queryByLabelText(/Destino/)).not.toBeInTheDocument();
  });
});
