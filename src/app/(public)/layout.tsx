import { PublicShell } from '@/features/legal/components/public-shell';

export default function PublicLayout({ children }: LayoutProps<'/'>) {
  return <PublicShell>{children}</PublicShell>;
}
