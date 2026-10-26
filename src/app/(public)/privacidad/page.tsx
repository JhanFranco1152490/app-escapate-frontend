import type { Metadata } from 'next';

import { LegalDocument } from '@/features/legal/components/legal-document';
import { loadLegalDocument } from '@/features/legal/load-legal-document';

export const metadata: Metadata = {
  title: 'Política de privacidad · Escápate',
  description:
    'Cómo trata Escápate los datos personales de quienes usan la plataforma y de sus clientes y viajeros.',
};

export default async function PrivacyPage() {
  return <LegalDocument source={await loadLegalDocument('privacidad')} />;
}
