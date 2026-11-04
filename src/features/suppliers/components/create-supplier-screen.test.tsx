import { screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { clearPageNotice, readPageNotice } from '@/lib/page-notice';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';
import { buildSupplierDetail } from '@/test/suppliers';

import { CreateSupplierScreen } from './create-supplier-screen';

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

let created: Record<string, unknown>[] = [];

beforeEach(() => {
  router.push.mockReset();
  created = [];
  server.use(
    sessionHandler(
      buildSession({ permissions: ['suppliers.view', 'suppliers.manage'] }),
    ),
    http.post(apiUrl('/api/suppliers'), async ({ request }) => {
      created.push((await request.json()) as Record<string, unknown>);
      return HttpResponse.json(buildSupplierDetail({ id: 55 }), {
        status: 201,
      });
    }),
  );
});

afterEach(() => {
  clearPageNotice();
});

const renderScreen = async () => {
  renderWithProviders(
    <SessionGuard>
      <CreateSupplierScreen />
    </SessionGuard>,
  );
  await screen.findByRole('heading', { name: 'Nuevo proveedor' });
  return userEvent.setup();
};

// Pega el texto en vez de escribirlo tecla por tecla: el formulario recibe los mismos
// eventos y la prueba no depende de lo rápida que esté la máquina.
async function fill(user: UserEvent, label: RegExp, text: string) {
  const field = screen.getByLabelText(label);
  await user.clear(field);
  await user.click(field);
  await user.paste(text);
}

const submit = (user: UserEvent) =>
  user.click(screen.getByRole('button', { name: 'Guardar proveedor' }));

async function fillMinimum(user: UserEvent) {
  await fill(user, /Nombre comercial/, 'Hotel Costa Azul');
  await user.click(screen.getByRole('checkbox', { name: 'Alojamiento' }));
  await fill(user, /Persona de contacto/, 'Mónica Salas');
  await fill(user, /Correo/, 'ventas@example.com');
}

describe('CreateSupplierScreen', () => {
  it('registra el proveedor y lleva a su ficha con un aviso', async () => {
    const user = await renderScreen();
    await fillMinimum(user);

    await submit(user);

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith('/proveedores/55'),
    );
    expect(created).toEqual([
      expect.objectContaining({
        trade_name: 'Hotel Costa Azul',
        categories: ['lodging'],
        contact_name: 'Mónica Salas',
        contact_email: 'ventas@example.com',
        contact_phone: null,
        document_type: null,
        document_number: null,
      }),
    ]);
    expect(readPageNotice('supplier:55')).toBe('Proveedor registrado.');
  });

  it('envía documento, varias categorías, teléfono y datos comerciales', async () => {
    const user = await renderScreen();
    await fillMinimum(user);
    await user.click(screen.getByRole('checkbox', { name: 'Cruceros' }));
    await user.click(
      screen.getByRole('checkbox', { name: 'Tours y actividades' }),
    );
    await user.selectOptions(
      screen.getByLabelText('Tipo de documento'),
      'Identificación extranjera',
    );
    await fill(user, /Número de documento/, 'ab-123456');
    await fill(user, /Teléfono/, '300 111 2233');
    await fill(user, /Comisión acordada/, '12,5');
    await fill(user, /Condiciones de pago/, '50 % al reservar');

    await submit(user);

    await waitFor(() => expect(created).toHaveLength(1));
    expect(created[0]).toMatchObject({
      categories: ['lodging', 'tours', 'cruise'],
      document_type: 'FOREIGN',
      document_number: 'AB123456',
      contact_phone: '+573001112233',
      commission_rate: '12.5',
      payment_terms: '50 % al reservar',
    });
  });

  it('vacío no llama a la API, cuenta los faltantes y marca los dos datos de contacto', async () => {
    const user = await renderScreen();

    await submit(user);

    expect(
      await screen.findByText('Faltan 4 campos obligatorios.'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Este campo es obligatorio.')).toHaveLength(2);
    expect(screen.getByText('Elige al menos una clasificación.')).toBeVisible();
    expect(
      screen.getAllByText('Indica un teléfono o un correo de contacto.'),
    ).toHaveLength(2);
    expect(created).toHaveLength(0);
  });

  it('un campo con solo espacios cuenta como vacío', async () => {
    const user = await renderScreen();
    await fillMinimum(user);
    await fill(user, /Nombre comercial/, '   ');

    await submit(user);

    expect(
      await screen.findByText('Este campo es obligatorio.'),
    ).toBeInTheDocument();
    expect(created).toHaveLength(0);
  });

  it('un tipo de documento sin número se rechaza', async () => {
    const user = await renderScreen();
    await fillMinimum(user);
    await user.selectOptions(screen.getByLabelText('Tipo de documento'), 'NIT');

    await submit(user);

    expect(
      await screen.findByText('Indica también el número.'),
    ).toBeInTheDocument();
    expect(created).toHaveLength(0);
  });

  it('un documento repetido de la API cae en su campo', async () => {
    server.use(
      http.post(apiUrl('/api/suppliers'), () =>
        HttpResponse.json(
          {
            detail: 'Revisa los datos enviados.',
            code: 'validation_error',
            fields: {
              document_number: ['Ya existe un proveedor con ese documento.'],
            },
          },
          { status: 422 },
        ),
      ),
    );
    const user = await renderScreen();
    await fillMinimum(user);

    await submit(user);

    expect(
      await screen.findByText('Ya existe un proveedor con ese documento.'),
    ).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });

  it('el error del teléfono de la API cae en el campo del teléfono', async () => {
    server.use(
      http.post(apiUrl('/api/suppliers'), () =>
        HttpResponse.json(
          {
            detail: 'Revisa los datos enviados.',
            code: 'validation_error',
            fields: {
              contact_phone: ['No es un teléfono válido para ese país.'],
            },
          },
          { status: 422 },
        ),
      ),
    );
    const user = await renderScreen();
    await fillMinimum(user);

    await submit(user);

    expect(
      await screen.findByText('No es un teléfono válido para ese país.'),
    ).toBeInTheDocument();
  });

  it('un error inesperado muestra un aviso general', async () => {
    server.use(
      http.post(apiUrl('/api/suppliers'), () =>
        HttpResponse.json(
          { detail: 'Error.', code: 'internal_error', fields: {} },
          { status: 500 },
        ),
      ),
    );
    const user = await renderScreen();
    await fillMinimum(user);

    await submit(user);

    expect(
      await screen.findByText(
        'No pudimos guardar el proveedor. Inténtalo de nuevo.',
      ),
    ).toBeInTheDocument();
  });
});
