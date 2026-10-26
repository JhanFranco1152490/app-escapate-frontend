import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { clearPageNotice, setPageNotice } from '@/lib/page-notice';
import { buildClientAsTraveler, buildTravelerDetail } from '@/test/clients';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import type { TravelerDetail } from '../api';
import { TravelerDetailScreen } from './traveler-detail-screen';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

afterEach(() => {
  clearPageNotice();
});

let requests = 0;

const renderScreen = ({
  traveler = buildTravelerDetail(),
  id = String(traveler.id),
  permissions = ['clients.view', 'travelers.view', 'travelers.manage'],
}: {
  traveler?: TravelerDetail;
  id?: string;
  permissions?: string[];
} = {}) => {
  requests = 0;
  server.use(
    sessionHandler(buildSession({ permissions })),
    http.get(apiUrl(`/api/travelers/${traveler.id}`), () => {
      requests += 1;
      return HttpResponse.json(traveler);
    }),
  );
  renderWithProviders(
    <SessionGuard>
      <TravelerDetailScreen id={id} />
    </SessionGuard>,
  );
};

const valueOf = (term: string) =>
  screen.getByText(term, { selector: 'dt' }).nextElementSibling;

const SEPARATE_DATA =
  'Sus datos de viajero se guardan aparte de su ficha de cliente: si cambias uno, el otro no cambia.';

describe('TravelerDetailScreen', () => {
  it('muestra los datos de un menor, su cliente de referencia y el registro', async () => {
    renderScreen({
      traveler: buildTravelerDetail({ notes: 'Prefiere ventana.' }),
    });

    expect(
      await screen.findByRole('heading', { name: 'Sofía Gómez Ruiz' }),
    ).toBeInTheDocument();
    expect(valueOf('Documento')).toHaveTextContent('TI 1090123456');
    expect(valueOf('Fecha de nacimiento')).toHaveTextContent(
      '12 de marzo de 2014 · 12 años',
    );
    expect(valueOf('Fecha de nacimiento')).toHaveTextContent('Menor de edad');
    expect(valueOf('Nacionalidad')).toHaveTextContent('Colombia');
    expect(
      screen.getByRole('link', { name: 'Marcela Gómez Ortiz' }),
    ).toHaveAttribute('href', '/clientes/12');
    expect(valueOf('Observaciones')).toHaveTextContent('Prefiere ventana.');
    expect(valueOf('Autorización de datos')).toHaveTextContent(
      'Registrada por Andrés Peña el 21 de octubre de 2026',
    );
    expect(screen.queryByText(SEPARATE_DATA)).not.toBeInTheDocument();
  });

  it('si es el mismo cliente, aclara que los datos son independientes', async () => {
    renderScreen({ traveler: buildClientAsTraveler() });

    expect(await screen.findByText(SEPARATE_DATA)).toBeInTheDocument();
    expect(screen.getByText('Es el cliente')).toBeInTheDocument();
    expect(screen.queryByText('Menor de edad')).not.toBeInTheDocument();
  });

  it('sin clients.view muestra el nombre del cliente sin enlace', async () => {
    renderScreen({ permissions: ['travelers.view'] });

    await screen.findByRole('heading', { name: 'Sofía Gómez Ruiz' });
    expect(valueOf('Cliente de referencia')).toHaveTextContent(
      'Marcela Gómez Ortiz',
    );
    expect(
      screen.queryByRole('link', { name: 'Marcela Gómez Ortiz' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Editar datos' }),
    ).not.toBeInTheDocument();
  });

  it('sin cliente de referencia lo dice', async () => {
    renderScreen({ traveler: buildTravelerDetail({ reference_client: null }) });

    await screen.findByRole('heading', { name: 'Sofía Gómez Ruiz' });
    expect(valueOf('Cliente de referencia')).toHaveTextContent(
      'Sin cliente de referencia',
    );
  });

  it('con travelers.manage ofrece editar y muestra el aviso del formulario', async () => {
    setPageNotice({ target: 'traveler:30', text: 'Viajero registrado.' });
    renderScreen();

    expect(
      await screen.findByRole('link', { name: 'Editar datos' }),
    ).toHaveAttribute('href', '/viajeros/30/editar');
    expect(screen.getByText('Viajero registrado.')).toBeInTheDocument();
  });

  it('un id imposible no llama a la API', async () => {
    renderScreen({ id: '0' });

    expect(
      await screen.findByText('No encontramos este viajero'),
    ).toBeInTheDocument();
    expect(requests).toBe(0);
  });
});
