import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/errors';
import { buildPackageDetail } from '@/test/quotes';

import { PackageGeneralForm } from './package-general-form';

const setup = (
  props: Partial<React.ComponentProps<typeof PackageGeneralForm>> = {},
) => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  render(
    <PackageGeneralForm
      submitLabel="Crear paquete"
      pending={false}
      onSubmit={onSubmit}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onSubmit, onCancel, user: userEvent.setup() };
};

const fill = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(
    screen.getByLabelText('Nombre *'),
    '  Santa Marta en familia ',
  );
  await user.type(screen.getByLabelText('Destino *'), 'Santa Marta');
};

describe('PackageGeneralForm', () => {
  it('empieza con 5 noches, precios para 2 personas y activo', () => {
    setup();

    expect(screen.getByLabelText('Noches')).toHaveValue('5');
    expect(screen.getByLabelText('Precios para')).toHaveValue('2');
    expect(screen.getByLabelText(/Activo/)).toBeChecked();
  });

  it('envía los datos limpios y en el formato de la API', async () => {
    const { onSubmit, user } = setup();

    await fill(user);
    await user.clear(screen.getByLabelText('Noches'));
    await user.type(screen.getByLabelText('Noches'), '7');
    await user.clear(screen.getByLabelText('% por defecto'));
    await user.type(screen.getByLabelText('% por defecto'), '12,5');
    await user.type(screen.getByLabelText('Pesos por dólar'), '4.100,50');
    await user.click(screen.getByRole('button', { name: 'Crear paquete' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Santa Marta en familia',
      destination: 'Santa Marta',
      description: null,
      nights: 7,
      reference_travelers: 2,
      default_markup_percent: '12.5',
      exchange_rate: '4100.50',
      is_active: true,
    });
  });

  it('un paquete inactivo se envía como inactivo', async () => {
    const { onSubmit, user } = setup();

    await fill(user);
    await user.click(screen.getByLabelText(/Activo/));
    await user.click(screen.getByRole('button', { name: 'Crear paquete' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: false }),
    );
  });

  it('pide nombre y destino', async () => {
    const { onSubmit, user } = setup();

    await user.click(screen.getByRole('button', { name: 'Crear paquete' }));

    expect(
      await screen.findByText('Indica el nombre y el destino.'),
    ).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('noches y personas van en enteros', async () => {
    const { onSubmit, user } = setup();

    await fill(user);
    await user.clear(screen.getByLabelText('Noches'));
    await user.type(screen.getByLabelText('Noches'), '2,5');
    await user.click(screen.getByRole('button', { name: 'Crear paquete' }));

    expect(
      await screen.findByText('Noches y personas van en números enteros.'),
    ).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rechaza un porcentaje o una tasa inválidos', async () => {
    const { onSubmit, user } = setup();

    await fill(user);
    await user.clear(screen.getByLabelText('% por defecto'));
    await user.type(screen.getByLabelText('% por defecto'), 'mucho');
    await user.click(screen.getByRole('button', { name: 'Crear paquete' }));
    expect(await screen.findByRole('alert')).toBeVisible();

    await user.clear(screen.getByLabelText('% por defecto'));
    await user.type(screen.getByLabelText('% por defecto'), '10');
    await user.type(screen.getByLabelText('Pesos por dólar'), 'abc');
    await user.click(screen.getByRole('button', { name: 'Crear paquete' }));

    expect(screen.getByRole('alert')).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('muestra los errores por campo que devuelve la API', async () => {
    const { user } = setup({
      onSubmit: vi.fn().mockRejectedValue(
        new ApiError(422, {
          detail: 'Datos inválidos',
          code: 'validation_error',
          fields: { name: ['Ya existe un paquete con ese nombre.'] },
        }),
      ),
    });

    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Crear paquete' }));

    expect(
      await screen.findByText('Ya existe un paquete con ese nombre.'),
    ).toBeVisible();
  });

  it('muestra el motivo de un conflicto y un mensaje genérico para el resto', async () => {
    const conflict = new ApiError(409, {
      detail: 'Alguien más cambió el paquete.',
      code: 'stale_version',
      fields: {},
    });
    const { user } = setup({
      onSubmit: vi
        .fn()
        .mockRejectedValueOnce(conflict)
        .mockRejectedValueOnce(new Error('caído')),
    });

    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Crear paquete' }));
    expect(
      await screen.findByText('Alguien más cambió el paquete.'),
    ).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Crear paquete' }));
    expect(
      await screen.findByText(
        'No pudimos completar la acción. Inténtalo de nuevo.',
      ),
    ).toBeVisible();
  });

  it('al editar parte de los datos del paquete', () => {
    setup({
      initial: buildPackageDetail({
        exchange_rate: '4100.50',
        is_active: false,
        description: 'Cinco noches frente al mar.',
      }),
      submitLabel: 'Guardar cambios',
    });

    expect(screen.getByLabelText('Nombre *')).toHaveValue(
      'Santa Marta en familia',
    );
    expect(screen.getByLabelText('Pesos por dólar')).toHaveValue('4100,50');
    expect(screen.getByLabelText(/Activo/)).not.toBeChecked();
    expect(screen.getByLabelText('Descripción')).toHaveValue(
      'Cinco noches frente al mar.',
    );
  });

  it('cancelar avisa y mientras guarda no deja volver a enviar', async () => {
    const { onCancel, user } = setup({ pending: true });

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled();
  });
});
