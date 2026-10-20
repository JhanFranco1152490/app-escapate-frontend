import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { RATE_LIMIT_MESSAGE } from '@/lib/api/errors';
import { apiUrl } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';

import {
  clearResetPrefill,
  readResetPrefill,
  setResetPrefill,
} from '../reset-prefill';
import { RequestResetScreen } from './request-reset-screen';

const SENT_MESSAGE =
  'Si los datos corresponden a una cuenta, enviamos un enlace a su correo. Vence en 30 minutos.';

afterEach(clearResetPrefill);

function respondToRequest(respond: () => Response | Promise<Response>) {
  const requests: unknown[] = [];
  server.use(
    http.post(apiUrl('/api/auth/password-reset'), async ({ request }) => {
      requests.push(await request.json());
      return respond();
    }),
  );
  return requests;
}

const accepted = () =>
  HttpResponse.json({ detail: 'Mensaje del API' }, { status: 202 });

async function submitDocument(number = '1090123456') {
  const user = userEvent.setup();
  if (number) {
    await user.type(screen.getByLabelText(/Número de documento/), number);
  }
  await user.click(screen.getByRole('button', { name: 'Enviar enlace' }));
}

describe('RequestResetScreen', () => {
  it('muestra el título, CC preseleccionado y el enlace al login', () => {
    renderWithProviders(<RequestResetScreen />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Recuperar contraseña' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Tipo de documento/)).toHaveValue('CC');
    expect(
      screen.getByRole('link', { name: 'Volver a iniciar sesión' }),
    ).toHaveAttribute('href', '/iniciar-sesion');
  });

  it('precarga el documento que venía del login y lo borra de la memoria', () => {
    setResetPrefill({ document_type: 'PA', document_number: 'AB123' });

    renderWithProviders(<RequestResetScreen />);

    expect(screen.getByLabelText(/Tipo de documento/)).toHaveValue('PA');
    expect(screen.getByLabelText(/Número de documento/)).toHaveValue('AB123');
    expect(readResetPrefill()).toBeUndefined();
  });

  it('con el número vacío no llama a la API', async () => {
    const requests = respondToRequest(accepted);
    renderWithProviders(<RequestResetScreen />);

    await submitDocument('');

    expect(
      await screen.findByText('Ingresa tu número de documento.'),
    ).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it('tras el 202 reemplaza el formulario por el aviso', async () => {
    const requests = respondToRequest(accepted);
    renderWithProviders(<RequestResetScreen />);

    await submitDocument();

    expect(await screen.findByRole('alert')).toHaveTextContent(SENT_MESSAGE);
    expect(requests).toEqual([
      { document_type: 'CC', document_number: '1090123456' },
    ]);
    expect(
      screen.queryByRole('button', { name: 'Enviar enlace' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Volver a iniciar sesión' }),
    ).toBeInTheDocument();
  });

  it('deshabilita el botón mientras envía', async () => {
    respondToRequest(async () => {
      await delay(50);
      return accepted();
    });
    renderWithProviders(<RequestResetScreen />);

    await submitDocument();

    expect(screen.getByRole('button', { name: 'Enviando…' })).toBeDisabled();
    expect(await screen.findByRole('alert')).toHaveTextContent(SENT_MESSAGE);
  });

  it('un 422 cae en el campo', async () => {
    respondToRequest(() =>
      HttpResponse.json(
        {
          detail: 'Datos no válidos.',
          code: 'validation_error',
          fields: { document_number: ['Mensaje del campo.'] },
        },
        { status: 422 },
      ),
    );
    renderWithProviders(<RequestResetScreen />);

    await submitDocument();

    expect(
      screen.getByLabelText(/Número de documento/),
    ).toHaveAccessibleDescription('Mensaje del campo.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('un 429 muestra el aviso de límite y deja el formulario', async () => {
    respondToRequest(() =>
      HttpResponse.json(
        { detail: 'Mensaje del API', code: 'throttled', fields: {} },
        { status: 429 },
      ),
    );
    renderWithProviders(<RequestResetScreen />);

    await submitDocument();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      RATE_LIMIT_MESSAGE,
    );
    expect(
      screen.getByRole('button', { name: 'Enviar enlace' }),
    ).toBeInTheDocument();
  });

  it('otro error muestra un aviso genérico', async () => {
    respondToRequest(() =>
      HttpResponse.json(
        { detail: 'Mensaje del API', code: 'internal_error', fields: {} },
        { status: 500 },
      ),
    );
    renderWithProviders(<RequestResetScreen />);

    await submitDocument();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos enviar la solicitud. Inténtalo de nuevo.',
    );
  });
});
