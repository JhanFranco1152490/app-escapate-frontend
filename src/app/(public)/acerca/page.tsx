import type { Metadata } from 'next';

import { AboutScreen } from '@/features/legal/components/about-screen';

export const metadata: Metadata = {
  title: 'Acerca de · Escápate',
  description:
    'Plataforma interna de gestión comercial y operativa de la agencia de viajes Escápate.',
};

export default function AboutPage() {
  return <AboutScreen />;
}
