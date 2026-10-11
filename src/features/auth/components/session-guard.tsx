'use client';

import { RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { ErrorState } from '@/components/error-state';
import { Button } from '@/components/ui/button';
import { isUnauthorized } from '@/lib/api/errors';

import { useLogout, useSession, type SessionUser } from '../api';
import { PanelSkeleton } from './panel-skeleton';

type GuardedSession = {
  user: SessionUser;
  signOut: () => Promise<void>;
  signingOut: boolean;
};

// Dentro del panel solo la guardia consulta la sesión; el resto lee de aquí. Si otro
// componente la consultara, al cerrar sesión (que vacía la caché) la volvería a pedir y el
// 401 provocaría una segunda redirección.
const SessionContext = createContext<GuardedSession | null>(null);

function useGuardedSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('Solo funciona dentro de SessionGuard');
  return value;
}

export const useCurrentUser = () => useGuardedSession().user;

export function useSignOut() {
  const { signOut, signingOut } = useGuardedSession();
  return { signOut, signingOut };
}

export function SessionGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { mutateAsync: logout, isPending: loggingOut } = useLogout();
  // El cierre de sesión vacía la caché. Sin esta marca, la guardia volvería a pedir la
  // sesión, recibiría un 401 y redirigiría por segunda vez (con un next que no aplica).
  const [signingOut, setSigningOut] = useState(false);
  const session = useSession({ enabled: !signingOut });
  const unauthorized = isUnauthorized(session.error);

  useEffect(() => {
    if (unauthorized && !signingOut)
      router.replace(loginPathFor(currentPath()));
  }, [unauthorized, signingOut, router]);

  const signOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await logout();
    } catch {
      // Si el cierre falla, la persona sigue en el panel y puede intentarlo otra vez.
      setSigningOut(false);
      return;
    }
    router.replace('/iniciar-sesion');
  }, [logout, router]);

  const user = session.data;
  const guarded = useMemo(
    () => user && { user, signOut, signingOut: signingOut || loggingOut },
    [user, signOut, signingOut, loggingOut],
  );

  // Solo un 401 saca a la persona: ante un 500 o sin red la sesión puede seguir viva, y
  // mandarla al login le haría perder lo que estaba haciendo.
  if (guarded && !unauthorized) {
    return (
      <SessionContext.Provider value={guarded}>
        {children}
      </SessionContext.Provider>
    );
  }
  if (session.isError && !unauthorized) {
    return (
      <main className="flex flex-1 items-center justify-center p-4">
        <ErrorState
          title="No pudimos cargar el panel"
          action={
            <Button onClick={() => void session.refetch()}>
              <RotateCcw aria-hidden="true" />
              Reintentar
            </Button>
          }
        >
          Se interrumpió la conexión con el servidor. Inténtalo de nuevo en un
          momento.
        </ErrorState>
      </main>
    );
  }
  return <PanelSkeleton />;
}

// Se lee de window y no de los hooks de navegación: useSearchParams obligaría a envolver
// todo el panel en Suspense, y la ruta solo hace falta en el momento de redirigir.
function currentPath() {
  return window.location.pathname + window.location.search;
}

function loginPathFor(path: string) {
  return path === '/'
    ? '/iniciar-sesion'
    : `/iniciar-sesion?next=${encodeURIComponent(path)}`;
}
