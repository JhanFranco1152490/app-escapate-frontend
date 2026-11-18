import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi, type Mock } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { ApiError } from '@/lib/api/errors';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';
import { buildAdvisor, buildTravelRequestDetail } from '@/test/travel-requests';

import { emptyRequestForm, requestFormValues } from '../form-values';
import type { RequestFormValues, RequestPayload } from '../schemas';
import { RequestForm } from './request-form';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

type User = ReturnType<typeof userEvent.setup>;

const ADVISORS = [
  buildAdvisor({ id: 2, full_name: 'Andrés Peña' }),
  buildAdvisor({ id: 5, full_name: 'Lucía Rangel' }),
];

const NEW_FORM = emptyRequestForm({
  client: { id: 7, name: 'Marcela Gómez Ortiz' },
  advisorId: 2,
});

const renderForm = async ({
  mode = 'create',
  defaultValues = NEW_FORM,
  original,
  currentAdvisor,
  onSubmit = vi
    .fn<(payload: RequestPayload) => Promise<unknown>>()
    .mockResolvedValue(undefined),
}: {
  mode?: 'create' | 'edit';
  defaultValues?: RequestFormValues;
  original?: { departure_date: string | null; window_end: string | null };
  currentAdvisor?: { id: number; full_name: string };
  onSubmit?: Mock<(payload: RequestPayload) => Promise<unknown>>;
} = {}) => {
  server.use(
    sessionHandler(
      buildSession({
        permissions: [
          'clients.view',
          'clients.manage',
          'travel_requests.manage',
        ],
      }),
    ),
    http.get(apiUrl('/api/travel-requests/advisors'), () =>
      HttpResponse.json(ADVISORS),
    ),
  );
  renderWithProviders(
    <SessionGuard>
      <RequestForm
        mode={mode}
        defaultValues={defaultValues}
        original={original}
        currentAdvisor={currentAdvisor}
        submitLabel="Guardar solicitud"
        cancelHref="/solicitudes"
        onSubmit={onSubmit}
      />
    </SessionGuard>,
  );
  await screen.findByRole('option', { name: 'Lucía Rangel' });
  return { onSubmit, user: userEvent.setup() };
};

// Pega el texto en vez de escribirlo tecla por tecla: el formulario recibe los mismos eventos
// y la prueba no depende de lo rápida que esté la máquina.
async function fill(user: User, label: string | RegExp, text: string) {
  const field = screen.getByLabelText(label);
  await user.clear(field);
  await user.click(field);
  await user.paste(text);
}

const submit = (user: User) =>
  user.click(screen.getByRole('button', { name: 'Guardar solicitud' }));

describe('RequestForm', () => {
  it('envía una solicitud con fechas exactas y sus preferencias', async () => {
    const { onSubmit, user } = await renderForm();
    await fill(user, /Destino/, 'San Andrés');
    await fill(user, /Salida/, '2030-12-18');
    await fill(user, /Adultos/, '2');
    await fill(user, /Presupuesto mínimo/, '6.000.000');
    await user.click(screen.getByRole('checkbox', { name: 'Familiar' }));
    await user.selectOptions(
      screen.getByLabelText('Categoría de alojamiento'),
      '4 estrellas',
    );
    await fill(
      user,
      /Condiciones y observaciones/,
      'Cerca de la playa.\nCon coche de bebé.',
    );

    await submit(user);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith({
      client_id: 7,
      destination: 'San Andrés',
      origin: null,
      date_mode: 'exact',
      departure_date: '2030-12-18',
      return_date: null,
      adults: 2,
      minors: 0,
      budget_min: 6_000_000,
      budget_max: null,
      trip_types: ['family'],
      accommodation_category: 'four_star',
      assigned_to_id: 2,
      notes: 'Cerca de la playa.\nCon coche de bebé.',
    });
  });

  it('el período flexible cambia los campos, y volver conserva lo escrito', async () => {
    const { onSubmit, user } = await renderForm();
    await fill(user, /Destino/, 'Cartagena');
    await fill(user, /Salida/, '2030-12-18');

    await user.click(screen.getByRole('radio', { name: 'Período flexible' }));
    expect(screen.queryByLabelText(/Salida/)).not.toBeInTheDocument();
    await fill(user, /Desde/, '2030-12-01');
    await fill(user, /Hasta/, '2030-12-31');
    await fill(user, /Noches aproximadas/, '5');
    await submit(user);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    const payload = onSubmit.mock.calls[0][0];
    expect(payload).toMatchObject({
      date_mode: 'flexible',
      window_start: '2030-12-01',
      window_end: '2030-12-31',
      approx_nights: 5,
    });
    expect(payload).not.toHaveProperty('departure_date');

    // Cada modo conserva lo suyo: la salida no se pierde ni muestra la fecha de "Desde".
    await user.click(screen.getByRole('radio', { name: 'Fechas exactas' }));
    expect(screen.getByLabelText(/Salida/)).toHaveValue('2030-12-18');
    await user.click(screen.getByRole('radio', { name: 'Período flexible' }));
    expect(screen.getByLabelText(/Desde/)).toHaveValue('2030-12-01');
  });

  it('sin los obligatorios no envía y dice cuántos faltan', async () => {
    const { onSubmit, user } = await renderForm({
      defaultValues: emptyRequestForm({ client: null, advisorId: 2 }),
    });

    await submit(user);

    expect(
      await screen.findByText('Faltan 3 campos obligatorios.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Indica la fecha de salida.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('no envía fechas invertidas, pasadas ni un presupuesto invertido', async () => {
    const { onSubmit, user } = await renderForm();
    await fill(user, /Destino/, 'San Andrés');
    await fill(user, /Salida/, '2020-01-10');
    await fill(user, /Regreso/, '2020-01-05');
    await fill(user, /Presupuesto mínimo/, '8.000.000');
    await fill(user, /Presupuesto máximo/, '6.000.000');

    await submit(user);

    expect(await screen.findByText('La fecha ya pasó.')).toBeInTheDocument();
    expect(
      screen.getByText('No puede ser anterior a la salida.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('No puede ser menor que el mínimo.'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('los errores del servidor caen en su campo', async () => {
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError(422, {
        detail: 'Datos inválidos.',
        code: 'validation_error',
        fields: {
          client_id: ['El cliente no existe.'],
          assigned_to_id: [
            'Elige un asesor activo que pueda gestionar solicitudes.',
          ],
        },
      }),
    );
    const { user } = await renderForm({ onSubmit });
    await fill(user, /Destino/, 'San Andrés');
    await fill(user, /Salida/, '2030-12-18');

    await submit(user);

    expect(
      await screen.findByText('El cliente no existe.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Elige un asesor activo que pueda gestionar solicitudes.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Revisa los campos marcados.')).toBeInTheDocument();
  });
});

describe('RequestForm en la edición', () => {
  const request = buildTravelRequestDetail({
    departure_date: '2020-01-10',
    return_date: '2020-01-15',
    assigned_to: { id: 9, full_name: 'Carlos Ibáñez', is_active: false },
  });

  it('el cliente queda fijo y el asesor inactivo se marca y se pide otro', async () => {
    const { onSubmit, user } = await renderForm({
      mode: 'edit',
      defaultValues: requestFormValues(request),
      original: { departure_date: '2020-01-10', window_end: null },
      currentAdvisor: request.assigned_to,
    });

    expect(screen.getByText('Marcela Gómez Ortiz')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Quitar' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Carlos Ibáñez (inactivo)' }),
    ).toBeDisabled();

    await submit(user);
    expect(
      await screen.findByText(
        'Elige un asesor activo que pueda gestionar solicitudes.',
      ),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    // La salida ya pasó, pero no cambió: se puede guardar con otro asesor.
    await user.selectOptions(
      screen.getByLabelText(/Asesor responsable/),
      'Lucía Rangel',
    );
    await submit(user);
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          departure_date: '2020-01-10',
          assigned_to_id: 5,
        }),
      ),
    );
  });
});
