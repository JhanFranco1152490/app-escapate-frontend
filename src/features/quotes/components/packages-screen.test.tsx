import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { buildPage } from '@/test/clients';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { buildPackageDetail, buildPackageListItem } from '@/test/quotes';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { PackagesScreen } from './packages-screen';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push }),
}));

beforeEach(() => push.mockClear());

const render = (
  permissions: string[],
  items = [buildPackageListItem()],
): URLSearchParams[] => {
  const queries: URLSearchParams[] = [];
  server.use(
    sessionHandler(buildSession({ permissions })),
    http.get(apiUrl('/api/packages'), ({ request }) => {
      queries.push(new URL(request.url).searchParams);
      return HttpResponse.json(buildPage(items));
    }),
  );
  renderWithProviders(
    <SessionGuard>
      <PackagesScreen />
    </SessionGuard>,
  );
  return queries;
};

describe('PackagesScreen', () => {
  it('lista los paquetes con su destino, noches y estado', async () => {
    render(
      ['quotes.view'],
      [
        buildPackageListItem(),
        buildPackageListItem({
          id: 6,
          code: 'PAQ-0006',
          name: 'Eje Cafetero',
          is_active: false,
        }),
      ],
    );

    const first = await screen.findByRole('link', {
      name: /Santa Marta en familia/,
    });
    expect(first).toHaveAttribute('href', '/paquetes/5');
    expect(first).toHaveTextContent('PAQ-0005 · Santa Marta');
    expect(first).toHaveTextContent('5 noches · precios para 4 personas');
    expect(first).toHaveTextContent('Activo');
    expect(
      screen.getByRole('link', { name: /Eje Cafetero/ }),
    ).toHaveTextContent('Inactivo');
  });

  it('sin paquetes explica para qué sirven', async () => {
    render(['quotes.view'], []);

    expect(await screen.findByText('Aún no hay paquetes')).toBeVisible();
  });

  it('buscar pide la búsqueda al servidor', async () => {
    const user = userEvent.setup();
    const queries = render(['quotes.view']);

    await screen.findByRole('link', { name: /Santa Marta en familia/ });
    await user.type(screen.getByLabelText('Buscar paquete'), 'Caribe');

    await waitFor(() =>
      expect(queries.some((query) => query.get('q') === 'Caribe')).toBe(true),
    );
  });

  it('sin permiso de gestión no se ofrece crear', async () => {
    render(['quotes.view']);

    await screen.findByRole('link', { name: /Santa Marta en familia/ });

    expect(
      screen.queryByRole('button', { name: 'Nuevo paquete' }),
    ).not.toBeInTheDocument();
  });

  it('crea un paquete y abre su ficha', async () => {
    const user = userEvent.setup();
    let body: unknown;
    render(['quotes.view', 'quotes.manage']);
    server.use(
      http.post(apiUrl('/api/packages'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(buildPackageDetail({ id: 9 }), {
          status: 201,
        });
      }),
    );

    await user.click(
      await screen.findByRole('button', { name: 'Nuevo paquete' }),
    );
    await user.type(screen.getByLabelText('Nombre *'), 'Cartagena histórica');
    await user.type(screen.getByLabelText('Destino *'), 'Cartagena');
    await user.click(screen.getByRole('button', { name: 'Crear paquete' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/paquetes/9'));
    expect(body).toMatchObject({
      name: 'Cartagena histórica',
      destination: 'Cartagena',
      nights: 5,
    });
  });

  it('cancelar la creación cierra el formulario', async () => {
    const user = userEvent.setup();
    render(['quotes.view', 'quotes.manage']);

    await user.click(
      await screen.findByRole('button', { name: 'Nuevo paquete' }),
    );
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByLabelText('Nombre *')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nuevo paquete' })).toBeVisible();
  });
});
