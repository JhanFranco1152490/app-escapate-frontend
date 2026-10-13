import { PanelLayout } from '@/features/panel/components/panel-layout';
import { SessionGuard } from '@/features/auth/components/session-guard';

export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <SessionGuard>
      <PanelLayout>{children}</PanelLayout>
    </SessionGuard>
  );
}
