import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { SessionGuard } from '@/features/auth/components/session-guard';
import { apiUrl, sessionHandler } from '@/test/handlers';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/server';
import { buildSession } from '@/test/session';

import { FollowUpAlertsBanner } from './follow-up-alerts-banner';

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));

const render = (
  permissions: string[],
  counts: { red: number; yellow: number; green: number },
) => {
  let asked = false;
  server.use(
    sessionHandler(buildSession({ permissions })),
    http.get(apiUrl('/api/follow-ups/alerts'), () => {
      asked = true;
      return HttpResponse.json(counts);
    }),
  );
  renderWithProviders(
    <SessionGuard>
      <FollowUpAlertsBanner />
    </SessionGuard>,
  );
  return () => asked;
};

describe('FollowUpAlertsBanner', () => {
  it('avisa cuántos seguimientos están vencidos y cuántos vencen hoy o mañana', async () => {
    render(['quotes.view'], { red: 2, yellow: 3, green: 9 });

    const banner = (await screen.findByText('2 vencidos')).closest(
      '[role="status"]',
    );

    expect(banner).toHaveTextContent('2 vencidos y 3 para hoy o mañana');
    expect(
      screen.getByRole('link', { name: 'Ver seguimientos' }),
    ).toHaveAttribute('href', '/seguimientos');
  });

  it('con solo vencidos o solo próximos nombra únicamente lo que hay', async () => {
    render(['quotes.view'], { red: 0, yellow: 4, green: 0 });

    const banner = (await screen.findByText('4 para hoy o mañana')).closest(
      '[role="status"]',
    );

    expect(banner).toHaveTextContent('4 para hoy o mañana');
    expect(banner).not.toHaveTextContent('vencidos');
  });

  it('sin nada que atender no aparece', async () => {
    const asked = render(['quotes.view'], { red: 0, yellow: 0, green: 5 });

    await waitFor(() => expect(asked()).toBe(true));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('sin permiso de ver cotizaciones no aparece ni consulta', async () => {
    const asked = render([], { red: 2, yellow: 3, green: 9 });

    // Mientras carga la sesión hay un esqueleto con rol status: se espera a que se vaya.
    await waitFor(() =>
      expect(screen.queryByRole('status')).not.toBeInTheDocument(),
    );

    expect(asked()).toBe(false);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
