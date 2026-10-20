import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';

export function AboutScreen() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="font-mono text-[0.625rem] tracking-[0.2em] text-orange-600 uppercase">
          Portal de asesores
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          Escápate
        </h1>
      </header>
      <p className="leading-relaxed">
        Escápate es una agencia de viajes de San José de Cúcuta, Colombia, que
        comercializa paquetes turísticos nacionales e internacionales: vuelos,
        hoteles, cruceros y tours.
      </p>
      <p className="leading-relaxed">
        Esta plataforma es la herramienta interna de la agencia. En ella el
        administrador y los asesores registran clientes y viajeros, arman
        cotizaciones, hacen seguimiento comercial y llevan el control de ventas
        y pagos. Solo entran las personas que la agencia registra: no es una
        tienda en línea y los clientes no necesitan una cuenta.
      </p>
      <p className="leading-relaxed">
        Se inicia sesión con el tipo y número de documento y la contraseña, o
        con la cuenta de Google registrada. Con Google solo se verifica quién es
        la persona; no se accede a su correo, archivos ni contactos. Los
        detalles están en la{' '}
        <Link
          href="/privacidad"
          className="font-medium text-primary underline underline-offset-4 hover:no-underline"
        >
          política de privacidad
        </Link>{' '}
        y en los{' '}
        <Link
          href="/terminos"
          className="font-medium text-primary underline underline-offset-4 hover:no-underline"
        >
          términos y condiciones
        </Link>
        .
      </p>
      <div>
        <Link
          href="/iniciar-sesion"
          className={buttonVariants({ variant: 'default' })}
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}
