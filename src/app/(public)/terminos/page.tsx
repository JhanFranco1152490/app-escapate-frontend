import type { Metadata } from 'next';

import { LegalDocument } from '@/features/legal/components/legal-document';
import { loadLegalDocument } from '@/features/legal/load-legal-document';

export const metadata: Metadata = {
  title: 'Términos y condiciones · Escápate',
  description: 'Condiciones de uso de la plataforma de gestión de Escápate.',
};

export default async function TermsPage() {
  return <LegalDocument source={await loadLegalDocument('terminos')} />;
}
