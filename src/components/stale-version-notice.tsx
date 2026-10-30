import { Alert } from './alert';
import { Button } from './ui/button';

type StaleVersionNoticeProps = {
  // El texto del 409: lo escribe la API para mostrarse tal cual.
  message: string;
  // Vuelve a pedir la ficha y reinicia el formulario con lo que guardó la otra persona.
  onReload: () => void;
  reloading?: boolean;
};

// Otra persona guardó antes. Lo escrito sigue en el formulario hasta que se recarga, para que
// se pueda copiar lo que haga falta antes de perderlo.
export function StaleVersionNotice({
  message,
  onReload,
  reloading = false,
}: StaleVersionNoticeProps) {
  return (
    <Alert title={message}>
      <div className="mt-3">
        <Button
          type="button"
          variant="outline"
          onClick={onReload}
          disabled={reloading}
        >
          {reloading ? 'Recargando…' : 'Recargar'}
        </Button>
      </div>
    </Alert>
  );
}
