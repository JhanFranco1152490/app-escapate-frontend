import Image from 'next/image';

export function BrandPanel() {
  return (
    <section className="relative hidden flex-1 overflow-hidden md:flex">
      <Image
        src="/brand/local-lounge.jpg"
        alt="Sala de espera de la oficina de Escápate en Cúcuta"
        fill
        sizes="(min-width: 768px) 60vw, 0px"
        loading="eager"
        className="object-cover object-[38%_50%]"
      />
      {/* Oscurece la foto hacia abajo para que el texto blanco mantenga el contraste. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-176 from-navy-950/40 via-navy-950/70 via-46% to-navy-950/97"
      />
      <div className="relative flex w-full flex-col justify-between gap-12 px-10 py-12 lg:px-16 lg:py-14">
        <Image
          src="/brand/escapate-logo-mono-white.png"
          alt="Escápate, agencia de viajes"
          width={214}
          height={130}
          className="h-auto w-44 lg:w-53.5"
        />
        <div className="flex max-w-140 flex-col gap-5.5 text-cream-50">
          <p className="font-mono text-[0.6875rem] tracking-[0.22em] text-cream-50/72 uppercase">
            Panel interno · Operación
          </p>
          <p className="font-heading text-[2.75rem] leading-none font-bold tracking-[-0.03em] lg:text-[3.875rem]">
            Tu viaje <em className="font-semibold text-orange-400">empieza</em>{' '}
            aquí.
          </p>
          <p className="max-w-107.5 text-[0.9375rem] leading-relaxed text-cream-50/78">
            Del otro lado del mostrador, la misma marca que ve el viajero. Aquí
            se registran los clientes, se arman las cotizaciones y se cierran
            las reservas.
          </p>
          <div aria-hidden="true" className="mt-2.5 h-px bg-cream-50/20" />
          <p className="flex flex-wrap items-center gap-3.5 font-mono text-[0.6875rem] tracking-[0.18em] text-cream-50/62 uppercase">
            <span>Cúcuta</span>
            <span aria-hidden="true" className="text-orange-500">
              ·
            </span>
            <span>Norte de Santander</span>
            <span aria-hidden="true" className="text-orange-500">
              ·
            </span>
            <span>Colombia</span>
          </p>
        </div>
      </div>
    </section>
  );
}
