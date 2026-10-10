import Image from 'next/image';

export function BrandPanel() {
  return (
    <section className="relative hidden flex-1 overflow-hidden md:flex">
      <Image
        src="/brand/local-lounge.jpg"
        alt="Sala de espera de la oficina de Escápate en Cúcuta"
        fill
        sizes="(min-width: 768px) 60vw, 0px"
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
        <div className="flex max-w-140 flex-col gap-4.5 text-cream-50">
          <p className="font-heading text-4xl leading-[1.05] font-semibold tracking-[-0.03em] lg:text-[3.375rem]">
            Cada viaje, de la solicitud a la maleta.
          </p>
          <p className="max-w-105 text-[0.9375rem] leading-relaxed text-cream-50/72">
            Panel interno para el equipo de la agencia: clientes, cotizaciones,
            proveedores y reservas en un solo lugar.
          </p>
          <p className="mt-6 font-mono text-[0.625rem] tracking-[0.18em] text-cream-50/60 uppercase">
            Acceso solo para personal autorizado
          </p>
        </div>
      </div>
    </section>
  );
}
