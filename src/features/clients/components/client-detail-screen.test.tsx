import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { clearPageNotice, setPageNotice } from '@/lib/page-notice';
import { buildClientDetail, buildCompanyDetail } from '@/test/clients';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import type { ClientDetail } from '../api';
import { ClientDetailScreen } from './client-detail-screen';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

afterEach(() => {
  clearPageNotice();
});

let requests = 0;

const renderScreen = ({
  client = buildClientDetail(),
  id = String(client.id),
  permissions = ['clients.view', 'clients.manage'],
}: {
  client?: ClientDetail;
  id?: string;
  permissions?: string[];
} = {}) => {
  requests = 0;
  server.use(
    sessionHandler(buildSession({ permissions })),
    http.get(apiUrl(`/api/clients/${client.id}`), () => {
      requests += 1;
      return HttpResponse.json(client);
    }),
  );
  renderWithProviders(
    <SessionGuard>
      <ClientDetailScreen id={id} />
    </SessionGuard>,
  );
};

const valueOf = (term: string) =>
  screen.getByText(term, { selector: 'dt' }).nextElementSibling;

describe('ClientDetailScreen', () => {
  it('muestra los datos de una persona, quién la registró y la autorización', async () => {
    renderScreen({
      client: buildClientDetail({
        contact_source: 'referral',
        contact_source_detail: 'Julián Prieto',
        notes: 'Prefiere viajar en temporada baja.',
      }),
    });

    expect(
      await screen.findByRole('heading', { name: 'Marcela Gómez Ortiz' }),
    ).toBeInTheDocument();
    expect(valueOf('Tipo')).toHaveTextContent('Persona');
    expect(valueOf('Documento')).toHaveTextContent('CC 1.020.304.050');
    expect(valueOf('Fecha de nacimiento')).toHaveTextContent(
      '15 de abril de 1988',
    );
    expect(valueOf('Teléfono')).toHaveTextContent('300 111 2233');
    expect(valueOf('Medio de contacto')).toHaveTextContent(
      'Referido: Julián Prieto',
    );
    expect(valueOf('Notas')).toHaveTextContent(
      'Prefiere viajar en temporada baja.',
    );
    expect(valueOf('Registrado')).toHaveTextContent('Por Andrés Peña el');
    expect(valueOf('Autorización de datos')).toHaveTextContent(
      'Registrada por Andrés Peña el 20 de octubre de 2026',
    );
  });

  it('una empresa muestra el NIT y no la fecha de nacimiento', async () => {
    renderScreen({
      client: buildCompanyDetail({ email: null, city: null }),
    });

    await screen.findByRole('heading', { name: 'Viajes Andinos S.A.S.' });
    expect(valueOf('Tipo')).toHaveTextContent('Empresa');
    expect(valueOf('Documento')).toHaveTextContent('NIT 900.123.456-8');
    expect(screen.queryByText('Fecha de nacimiento')).not.toBeInTheDocument();
    expect(valueOf('Correo')).toHaveTextContent('Sin registrar');
  });

  it('con clients.manage ofrece editar', async () => {
    renderScreen();

    expect(
      await screen.findByRole('link', { name: 'Editar datos' }),
    ).toHaveAttribute('href', '/clientes/12/editar');
  });

  it('sin clients.manage no ofrece editar', async () => {
    renderScreen({ permissions: ['clients.view'] });

    await screen.findByRole('heading', { name: 'Marcela Gómez Ortiz' });
    expect(
      screen.queryByRole('link', { name: 'Editar datos' }),
    ).not.toBeInTheDocument();
  });

  it('muestra el aviso que dejó el formulario', async () => {
    setPageNotice({ target: 'client:12', text: 'Cliente registrado.' });
    renderScreen();

    expect(await screen.findByText('Cliente registrado.')).toBeInTheDocument();
  });

  it('un cliente que no existe muestra "No encontramos este cliente"', async () => {
    server.use(
      http.get(apiUrl('/api/clients/99'), () =>
        HttpResponse.json(
          { detail: 'No encontrado.', code: 'not_found', fields: {} },
          { status: 404 },
        ),
      ),
    );
    renderScreen({ id: '99' });

    expect(
      await screen.findByText('No encontramos este cliente'),
    ).toBeInTheDocument();
  });

  it('un id imposible no llama a la API', async () => {
    renderScreen({ id: 'abc' });

    expect(
      await screen.findByText('No encontramos este cliente'),
    ).toBeInTheDocument();
    expect(requests).toBe(0);
  });
});

describe('ClientDetailScreen: solicitudes del cliente', () => {
  it('con los permisos de solicitudes ofrece registrar una y ver las suyas', async () => {
    renderScreen({
      permissions: [
        'clients.view',
        'travel_requests.view',
        'travel_requests.manage',
      ],
    });

    expect(
      await screen.findByRole('link', { name: /Nueva solicitud/ }),
    ).toHaveAttribute('href', '/solicitudes/nueva?client_id=12');
    expect(
      screen.getByRole('link', { name: /Ver solicitudes/ }),
    ).toHaveAttribute('href', '/solicitudes?client_id=12');
  });

  it('con solo ver solicitudes no ofrece registrar una', async () => {
    renderScreen({ permissions: ['clients.view', 'travel_requests.view'] });

    expect(
      await screen.findByRole('link', { name: /Ver solicitudes/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Nueva solicitud/ }),
    ).not.toBeInTheDocument();
  });

  it('sin permisos de solicitudes no muestra ningún enlace a ellas', async () => {
    renderScreen({ permissions: ['clients.view'] });

    await screen.findByRole('heading', { name: 'Marcela Gómez Ortiz' });
    expect(
      screen.queryByRole('link', { name: /solicitud/i }),
    ).not.toBeInTheDocument();
  });
});
