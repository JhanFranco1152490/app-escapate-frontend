import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { buildPackageDetail, buildQuoteItem } from '@/test/quotes';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import type { PackageDetail } from '../package-api';
import { PackageDetailScreen } from './package-detail-screen';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const render = (
  permissions: string[],
  pack: PackageDetail = buildPackageDetail(),
) => {
  server.use(
    sessionHandler(buildSession({ permissions })),
    http.get(apiUrl('/api/packages/5'), () => HttpResponse.json(pack)),
  );
  renderWithProviders(
    <SessionGuard>
      <PackageDetailScreen id="5" />
    </SessionGuard>,
  );
};

describe('PackageDetailScreen', () => {
  it('muestra el paquete, sus servicios y el precio calculado', async () => {
    render(['quotes.view']);

    expect(
      await screen.findByRole('heading', { name: 'Santa Marta en familia' }),
    ).toBeVisible();
    expect(screen.getByText('Cinco noches frente al mar.')).toBeVisible();
    expect(screen.getByText('Activo')).toBeVisible();
    const services = screen.getByRole('region', { name: 'Servicios' });
    expect(within(services).getByText('Hotel Las Américas')).toBeVisible();
    expect(
      within(services).getByText('Precio del paquete').nextElementSibling,
    ).toHaveTextContent(/3\.105\.000/);
    expect(
      within(services).getByText('Por persona (4)').nextElementSibling,
    ).toHaveTextContent(/776\.250/);
  });

  it('un paquete sin servicios invita a agregarlos y no calcula por persona', async () => {
    render(
      ['quotes.view'],
      buildPackageDetail({
        items: [],
        totals: {
          ...buildPackageDetail().totals,
          sale: 0,
          profit: 0,
          per_person: null,
        },
      }),
    );

    expect(
      await screen.findByText('Agrega los servicios que incluye el paquete.'),
    ).toBeVisible();
    expect(
      screen.getByText('Por persona (4)').nextElementSibling,
    ).toHaveTextContent('—');
  });

  it('sin permiso de gestión no hay botones de cambio', async () => {
    render(['quotes.view']);

    await screen.findByRole('heading', { name: 'Santa Marta en familia' });

    expect(
      screen.queryByRole('button', { name: 'Editar datos' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Agregar servicio' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^Quitar/ }),
    ).not.toBeInTheDocument();
  });

  it('edita los datos generales con la versión que se está viendo', async () => {
    const user = userEvent.setup();
    let body: unknown;
    render(['quotes.view', 'quotes.manage']);
    server.use(
      http.put(apiUrl('/api/packages/5'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          buildPackageDetail({ name: 'Santa Marta de lujo', version: 2 }),
        );
      }),
    );

    await user.click(
      await screen.findByRole('button', { name: 'Editar datos' }),
    );
    await user.clear(screen.getByLabelText('Nombre *'));
    await user.type(screen.getByLabelText('Nombre *'), 'Santa Marta de lujo');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(
      await screen.findByRole('heading', { name: 'Santa Marta de lujo' }),
    ).toBeVisible();
    expect(body).toMatchObject({
      name: 'Santa Marta de lujo',
      expected_version: 1,
    });
    expect(screen.queryByLabelText('Nombre *')).not.toBeInTheDocument();
  });

  it('quita un servicio y lo avisa', async () => {
    const user = userEvent.setup();
    let removed = false;
    render(['quotes.view', 'quotes.manage']);
    server.use(
      http.delete(apiUrl('/api/packages/5/items/40'), () => {
        removed = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await user.click(
      await screen.findByRole('button', { name: 'Quitar Hotel Las Américas' }),
    );

    expect(await screen.findByText('Servicio quitado.')).toBeVisible();
    expect(removed).toBe(true);
  });

  it('abre el panel para agregar o editar un servicio y se puede cerrar', async () => {
    const user = userEvent.setup();
    render(
      ['quotes.view', 'quotes.manage'],
      buildPackageDetail({ items: [buildQuoteItem()] }),
    );

    await user.click(
      await screen.findByRole('button', { name: 'Agregar servicio' }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Nuevo servicio' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Nuevo servicio' }),
      ).not.toBeInTheDocument(),
    );

    await user.click(
      screen.getByRole('button', { name: 'Editar Hotel Las Américas' }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Editar servicio' }),
    ).toBeVisible();
  });

  it('un paquete que no existe lo dice', async () => {
    server.use(
      sessionHandler(buildSession({ permissions: ['quotes.view'] })),
      http.get(apiUrl('/api/packages/5'), () =>
        HttpResponse.json(
          { detail: 'No existe.', code: 'not_found', fields: {} },
          { status: 404 },
        ),
      ),
    );
    renderWithProviders(
      <SessionGuard>
        <PackageDetailScreen id="5" />
      </SessionGuard>,
    );

    expect(
      await screen.findByText('No encontramos este paquete'),
    ).toBeVisible();
  });
});
