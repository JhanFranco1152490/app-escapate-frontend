import Link from 'next/link';

export function LegalLinks({ className }: { className?: string }) {
  return (
    <nav aria-label="Información legal" className={className}>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <li>
          <Link
            href="/privacidad"
            className="underline underline-offset-4 hover:no-underline"
          >
            Política de privacidad
          </Link>
        </li>
        <li>
          <Link
            href="/terminos"
            className="underline underline-offset-4 hover:no-underline"
          >
            Términos y condiciones
          </Link>
        </li>
      </ul>
    </nav>
  );
}
