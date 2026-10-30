import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/errors';
import { buildClientDetail } from '@/test/clients';
import { renderWithProviders } from '@/test/render';

import { EMPTY_CLIENT_FORM, clientFormValues } from '../form-values';
import type { ClientFormValues, ClientPayload } from '../schemas';
import { ClientForm } from './client-form';

const renderForm = ({
  mode = 'create',
  defaultValues = EMPTY_CLIENT_FORM,
  onSubmit = vi
    .fn<(payload: ClientPayload) => Promise<unknown>>()
    .mockResolvedValue(undefined),
}: {
  mode?: 'create' | 'edit';
  defaultValues?: ClientFormValues;
  onSubmit?: (payload: ClientPayload) => Promise<unknown>;
} = {}) => {
  renderWithProviders(
    <ClientForm
      mode={mode}
      defaultValues={defaultValues}
      submitLabel="Guardar cliente"
      cancelHref="/clientes"
      onSubmit={onSubmit}
    />,
  );
  return { onSubmit, user: userEvent.setup() };
};

const field = (name: string) => screen.getByLabelText(name, { exact: false });

// Pega el texto en vez de escribirlo tecla por tecla: el formulario recibe los mismos
// eventos y la prueba no depende de lo rápida que esté la máquina.
async function typeInto(
  user: ReturnType<typeof userEvent.setup>,
  element: HTMLElement,
  text: string,
) {
  await user.click(element);
  await user.paste(text);
}

async function fillPerson(user: ReturnType<typeof userEvent.setup>) {
  await typeInto(user, field('Nombres'), 'Marcela');
  await typeInto(user, field('Apellidos'), 'Gómez Ortiz');
  await typeInto(
    user,
    screen.getByRole('textbox', { name: /Teléfono/ }),
    '300 111 2233',
  );
  await user.selectOptions(field('Medio de contacto'), 'WhatsApp');
}

const submit = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Guardar cliente' }));

describe('ClientForm', () => {
  it('con todo vacío no llama a la API y dice cuántos campos faltan', async () => {
    const { onSubmit, user } = renderForm();

    await submit(user);

    expect(
      await screen.findByText('Faltan 5 campos obligatorios.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Confirma que el cliente autorizó el tratamiento de sus datos.',
      ),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envía una persona con el teléfono en E.164', async () => {
    const { onSubmit, user } = renderForm();
    await fillPerson(user);
    await user.click(screen.getByRole('checkbox'));

    await submit(user);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        client_type: 'person',
        first_name: 'Marcela',
        phone: '+573001112233',
        contact_source: 'whatsapp',
        business_name: null,
      }),
    );
  });

  it('al cambiar a empresa pide la razón social y fija el NIT', async () => {
    const { onSubmit, user } = renderForm();
    await typeInto(user, field('Nombres'), 'Quedó escrito');

    await user.click(screen.getByRole('radio', { name: 'Empresa' }));

    expect(screen.queryByLabelText('Nombres', { exact: false })).toBeNull();
    expect(field('Tipo de documento')).toHaveValue('NIT');
    expect(field('Tipo de documento')).toBeDisabled();
    expect(screen.queryByLabelText('Fecha de nacimiento')).toBeNull();
    await typeInto(user, field('Razón social'), 'Viajes Andinos S.A.S.');
    await typeInto(user, field('Número de documento'), '900.123.456-8');
    await typeInto(
      user,
      screen.getByRole('textbox', { name: /Teléfono/ }),
      '607 555 1234',
    );
    await user.selectOptions(field('Medio de contacto'), 'Google');
    await user.click(screen.getByRole('checkbox'));
    await submit(user);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        client_type: 'company',
        first_name: null,
        business_name: 'Viajes Andinos S.A.S.',
        document_type: 'NIT',
        document_number: '9001234568',
      }),
    );
  });

  it('un NIT con el dígito equivocado se marca en su campo', async () => {
    const { onSubmit, user } = renderForm();
    await user.click(screen.getByRole('radio', { name: 'Empresa' }));
    await typeInto(user, field('Número de documento'), '900.123.456-1');

    await submit(user);

    expect(
      await screen.findByText('El dígito de verificación del NIT no coincide.'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('"Otro" muestra y exige el detalle; "Referido" lo deja opcional', async () => {
    const { onSubmit, user } = renderForm();
    await fillPerson(user);
    await user.click(screen.getByRole('checkbox'));

    await user.selectOptions(field('Medio de contacto'), 'Otro');
    await submit(user);
    expect(await screen.findByText('Cuéntanos cuál.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.selectOptions(field('Medio de contacto'), 'Referido');
    expect(field('¿Quién lo refirió?')).toBeInTheDocument();
    await submit(user);
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('sin la autorización no se envía', async () => {
    const { onSubmit, user } = renderForm();
    await fillPerson(user);

    await submit(user);

    expect(await screen.findByText('Falta 1 campo obligatorio.')).toBeVisible();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('un número pegado con su indicativo cambia el país del teléfono', async () => {
    const { onSubmit, user } = renderForm();
    await fillPerson(user);
    const phone = screen.getByRole('textbox', { name: /Teléfono/ });
    await user.clear(phone);
    await user.click(phone);
    await user.paste('+58 412 555 0101');

    expect(
      screen.getByRole('combobox', { name: 'País del teléfono' }),
    ).toHaveValue('VE');
    await user.click(screen.getByRole('checkbox'));
    await submit(user);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '+584125550101' }),
    );
  });

  it('un número que no es de ese país se marca sin llamar a la API', async () => {
    const { onSubmit, user } = renderForm();
    await fillPerson(user);
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'País del teléfono' }),
      'PE',
    );
    await user.click(screen.getByRole('checkbox'));

    await submit(user);

    expect(
      await screen.findByText('No es un teléfono válido para ese país.'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('los errores del servidor caen en su campo', async () => {
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError(422, {
        detail: 'Datos inválidos.',
        code: 'validation_error',
        fields: {
          document_number: ['Ya existe un cliente con ese documento.'],
        },
      }),
    );
    const { user } = renderForm({ onSubmit });
    await fillPerson(user);
    await typeInto(user, field('Número de documento'), '1020304050');
    await user.click(screen.getByRole('checkbox'));

    await submit(user);

    expect(
      await screen.findByText('Ya existe un cliente con ese documento.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Revisa los campos marcados.')).toBeInTheDocument();
    expect(field('Número de documento')).toHaveFocus();
  });

  it('la ciudad sugiere ciudades frecuentes pero acepta cualquier otra', async () => {
    const { onSubmit, user } = renderForm();
    const city = field('Ciudad');
    const suggestions = document.getElementById(city.getAttribute('list')!)!;

    expect(
      [...suggestions.querySelectorAll('option')].map((option) => option.value),
    ).toEqual(expect.arrayContaining(['Cúcuta', 'Villa del Rosario']));
    await fillPerson(user);
    await typeInto(user, city, 'Valencia');
    await user.click(screen.getByRole('checkbox'));
    await submit(user);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ city: 'Valencia' }),
    );
  });

  it('en la edición no deja cambiar el tipo ni pide la autorización', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { user } = renderForm({
      mode: 'edit',
      defaultValues: clientFormValues(buildClientDetail()),
      onSubmit,
    });

    expect(screen.getByRole('radio', { name: 'Empresa' })).toBeDisabled();
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.getByRole('textbox', { name: /Teléfono/ })).toHaveValue(
      '3001112233',
    );
    await submit(user);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        client_type: 'person',
        document_number: '1020304050',
        phone: '+573001112233',
      }),
    );
  });
});
