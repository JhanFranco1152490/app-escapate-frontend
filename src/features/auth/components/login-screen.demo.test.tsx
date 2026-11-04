import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiUrl, noSessionHandlers } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { DEMO_ACCOUNTS } from '../demo-accounts';
import { LoginScreen } from './login-screen';

// La bandera se lee al cargar el módulo del login, así que se fija antes de los imports.
vi.hoisted(() => {
  process.env.NEXT_PUBLIC_DEMO_ACCOUNTS = 'true';
});

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

beforeEach(() => {
  router.replace.mockReset();
  server.use(...noSessionHandlers);
});

const operations = DEMO_ACCOUNTS.find(
  (account) => account.key === 'operations',
)!;

async function chooseOperations() {
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole('button', { name: /cuenta de demostración/i }),
  );
  await user.click(
    await screen.findByRole('menuitem', { name: new RegExp(operations.role) }),
  );
}

describe('LoginScreen con cuentas de demostración', () => {
  it('elegir una cuenta inicia sesión con sus credenciales y entra al panel', async () => {
    const received = vi.fn();
    server.use(
      http.post(apiUrl('/api/auth/login'), async ({ request }) => {
        received(await request.json());
        return HttpResponse.json(buildSession());
      }),
    );
    renderWithProviders(<LoginScreen />, { searchParams: '?next=/clientes' });

    await chooseOperations();

    await vi.waitFor(() => expect(router.replace).toHaveBeenCalled());
    expect(received).toHaveBeenCalledExactlyOnceWith({
      document_type: operations.document_type,
      document_number: operations.document_number,
      password: operations.password,
    });
    expect(router.replace).toHaveBeenCalledWith('/clientes');
  });

  it('si la cuenta no existe muestra el aviso y deja el formulario con el documento', async () => {
    server.use(
      http.post(apiUrl('/api/auth/login'), () =>
        HttpResponse.json(
          { detail: 'x', code: 'invalid_credentials', fields: {} },
          { status: 401 },
        ),
      ),
    );
    renderWithProviders(<LoginScreen />);

    await chooseOperations();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El documento o la contraseña no son válidos.',
    );
    expect(screen.getByLabelText(/Número de documento/)).toHaveValue(
      operations.document_number,
    );
    expect(screen.getByLabelText(/^Contraseña/)).toHaveValue('');
    expect(router.replace).not.toHaveBeenCalled();
  });
});
