import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/errors';
import { buildServiceDetail } from '@/test/tourist-services';
import { renderWithProviders } from '@/test/render';

import type { ServiceType } from '../api';
import { emptyServiceForm, serviceFormValues } from '../form-values';
import type { ServiceFormValues, ServicePayload } from '../schemas';
import { TouristServiceForm } from './tourist-service-form';

type User = ReturnType<typeof userEvent.setup>;

const renderForm = ({
  mode = 'create',
  serviceTypes = ['lodging', 'tours'],
  defaultValues = emptyServiceForm(serviceTypes),
  onSubmit = vi
    .fn<(payload: ServicePayload) => Promise<unknown>>()
    .mockResolvedValue(undefined),
}: {
  mode?: 'create' | 'edit';
  serviceTypes?: ServiceType[];
  defaultValues?: ServiceFormValues;
  onSubmit?: (payload: ServicePayload) => Promise<unknown>;
} = {}) => {
  renderWithProviders(
    <TouristServiceForm
      mode={mode}
      supplierName="Hotel Costa Azul"
      serviceTypes={serviceTypes}
      defaultValues={defaultValues}
      submitLabel="Guardar servicio"
      cancelHref="/proveedores/40"
      onSubmit={onSubmit}
    />,
  );
  return { onSubmit, user: userEvent.setup() };
};

const field = (label: string | RegExp) => screen.getByLabelText(label);

// Pega el texto en vez de escribirlo tecla por tecla: el formulario recibe los mismos eventos
// y la prueba no depende de lo rápida que esté la máquina.
async function fill(user: User, label: string | RegExp, text: string) {
  await user.click(field(label));
  await user.paste(text);
}

const submit = (user: User) =>
  user.click(screen.getByRole('button', { name: 'Guardar servicio' }));

describe('TouristServiceForm', () => {
  it('muestra el proveedor fijo y solo los tipos que él ofrece', () => {
    renderForm();

    expect(screen.getByText('Hotel Costa Azul')).toBeInTheDocument();
    expect(
      screen.getAllByRole('radio').map((radio) => radio.getAttribute('value')),
    ).toEqual(['lodging', 'tours']);
    expect(screen.queryByText(/Características/)).not.toBeInTheDocument();
  });

  it('con una sola clasificación el tipo ya viene elegido', () => {
    renderForm({ serviceTypes: ['tours'] });

    expect(
      screen.getByRole('radio', { name: 'Tours y actividades' }),
    ).toBeChecked();
    expect(
      screen.getByRole('heading', { name: 'Características del tour' }),
    ).toBeInTheDocument();
  });

  it('con todo vacío no llama a la API y dice cuántos campos faltan', async () => {
    const { onSubmit, user } = renderForm();

    await submit(user);

    expect(
      await screen.findByText('Faltan 3 campos obligatorios.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Elige el tipo de servicio.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('cuenta también los campos propios del tipo que faltan', async () => {
    const { onSubmit, user } = renderForm();
    await user.click(screen.getByRole('radio', { name: 'Alojamiento' }));
    await fill(user, /Nombre del servicio/, 'Habitación familiar');
    await fill(user, /Destino/, 'Cartagena');

    await submit(user);

    expect(
      await screen.findByText('Faltan 2 campos obligatorios.'),
    ).toBeInTheDocument();
    expect(field(/Capacidad máxima/)).toHaveAccessibleDescription(
      expect.stringContaining('Este campo es obligatorio.'),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('registra un alojamiento con sus características', async () => {
    const { onSubmit, user } = renderForm();
    await user.click(screen.getByRole('radio', { name: 'Alojamiento' }));
    await fill(user, /Nombre del servicio/, 'Habitación familiar');
    await fill(user, /Destino/, 'Cartagena');
    await user.selectOptions(field(/Tipo de alojamiento/), 'Hotel');
    await fill(user, /Capacidad máxima/, '4');
    await user.type(field('Check-in'), '15:00');
    await user.click(screen.getByRole('checkbox', { name: 'Wifi' }));
    await user.click(
      screen.getByRole('checkbox', { name: 'Traslados aeropuerto' }),
    );

    await submit(user);

    expect(onSubmit).toHaveBeenCalledWith({
      service_type: 'lodging',
      name: 'Habitación familiar',
      destination: 'Cartagena',
      description: null,
      conditions: null,
      attributes: {
        lodging_kind: 'hotel',
        stars: null,
        meal_plan: null,
        max_capacity: 4,
        check_in_time: '15:00',
        check_out_time: null,
        includes: ['airport_transfers', 'wifi'],
      },
    });
  });

  it('al cambiar de tipo descarta los campos propios y conserva los comunes', async () => {
    const { onSubmit, user } = renderForm();
    await user.click(screen.getByRole('radio', { name: 'Alojamiento' }));
    await fill(user, /Nombre del servicio/, 'Tour Islas del Rosario');
    await fill(user, /Destino/, 'Cartagena');
    await fill(user, /Capacidad máxima/, '4');

    await user.click(
      screen.getByRole('radio', { name: 'Tours y actividades' }),
    );

    expect(screen.queryByLabelText(/Capacidad máxima/)).not.toBeInTheDocument();
    expect(field(/Nombre del servicio/)).toHaveValue('Tour Islas del Rosario');
    await fill(user, /^Duración/, '8');
    await submit(user);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        service_type: 'tours',
        attributes: {
          duration_value: 8,
          duration_unit: 'hours',
          modality: null,
          meeting_point: null,
          includes: [],
        },
      }),
    );
  });

  it('los errores del servidor caen en su campo, también los de los atributos', async () => {
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError(422, {
        detail: 'Datos inválidos.',
        code: 'validation_error',
        fields: {
          service_type: [
            'El proveedor no tiene la clasificación Alojamiento. Agrégala en su ficha antes de registrar este servicio.',
          ],
          'attributes.max_capacity': ['Debe ser menor o igual a 50.'],
        },
      }),
    );
    const { user } = renderForm({
      onSubmit,
      defaultValues: serviceFormValues(buildServiceDetail()),
    });

    await submit(user);

    expect(
      await screen.findByText(/no tiene la clasificación Alojamiento/),
    ).toBeInTheDocument();
    expect(field(/Capacidad máxima/)).toHaveAccessibleDescription(
      expect.stringContaining('Debe ser menor o igual a 50.'),
    );
    expect(screen.getByText('Revisa los campos marcados.')).toBeInTheDocument();
  });

  it('en la edición el tipo se ve pero no se cambia', () => {
    renderForm({
      mode: 'edit',
      serviceTypes: ['lodging'],
      defaultValues: serviceFormValues(buildServiceDetail()),
    });

    expect(screen.getByRole('radio', { name: 'Alojamiento' })).toBeDisabled();
    expect(
      screen.getByText(/El tipo de un servicio no se puede cambiar/),
    ).toBeInTheDocument();
    expect(field(/Capacidad máxima/)).toHaveValue('4');
  });
});
